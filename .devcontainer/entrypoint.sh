#!/bin/bash

export HOME=/home/$CONTAINER_USER

# カレントディレクトリの uid と gid を調べる
uid=$(stat -c "%u" $CONTAINER_WORKDIR)
gid=$(stat -c "%g" $CONTAINER_WORKDIR)

if [ "$uid" -ne 0 ]; then
    if [ "$(id -u $CONTAINER_USER)" -ne $uid ]; then
        # すでに存在しているユーザーがいれば削除
        EXISTING_USER=$(id -nu $uid)
        if [ $EXISTING_USER ] ; then
            userdel -r $EXISTING_USER
        fi

        # builder ユーザーの uid とカレントディレクトリの uid が異なる場合、
        # builder の uid をカレントディレクトリの uid に変更する。
        # ホームディレクトリは usermod によって正常化される。
        usermod -u $uid $CONTAINER_USER
    fi
    if [ "$(id -g $CONTAINER_USER)" -ne $gid ]; then
        # すでに存在しているグループがあれば削除
        EXISTING_GROUP=$(id -ng $gid)
        if [ $EXISTING_GROUP ] ; then
            groupdel $EXISTING_GROUP
        fi

        # builder ユーザーの gid とカレントディレクトリの gid が異なる場合、
        # builder の gid をカレントディレクトリの gid に変更し、ホームディレクトリの
        # gid も正常化する。
        getent group $gid >/dev/null 2>&1 || groupmod -g $gid $CONTAINER_USER
        chgrp -R $gid $HOME
    fi
fi

# このスクリプト自体は root で実行されているので、uid/gid 調整済みの builder ユーザー
# として指定されたコマンドを実行する。
exec setpriv --reuid=$CONTAINER_USER --regid=$CONTAINER_USER --init-groups "$@"
