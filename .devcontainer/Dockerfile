FROM node:22-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV DEBCONF_NOWARNINGS=yes

RUN apt-get update && apt-get install -y --no-install-recommends \
  sudo \
  ca-certificates \
  curl \
  git \
  locales-all \
  jq \
  bash \
  && rm -rf /var/lib/apt/lists/*

ARG CONTAINER_USER
ENV CONTAINER_USER=$CONTAINER_USER
RUN useradd -ms /bin/bash $CONTAINER_USER
RUN echo $CONTAINER_USER:password | chpasswd
RUN echo "$CONTAINER_USER   ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# ユーザID等をホストに合わせる
COPY --chown=$CONTAINER_USER --chmod=755 .devcontainer/entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]

ARG CONTAINER_WORKDIR
ENV CONTAINER_WORKDIR=$CONTAINER_WORKDIR
WORKDIR $CONTAINER_WORKDIR

CMD ["bash"]
