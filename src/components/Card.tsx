import React from "react";

interface CardProps {
  children: any;
  className?: string;
  theme?: string;
  onClick?: () => void;
}

const Card = ({ children, className = "", theme, onClick }: CardProps) => (
  <div
    className={`
    rounded-3xl h-full flex flex-col overflow-hidden relative
    transition-colors duration-300
    bg-white border-gray-200 shadow-md
    dark:bg-neutral-700/30 dark:border-white/10 dark:backdrop-blur-md
    ${className}
  `}
    onClick={onClick}
  >
    {children}
  </div>
);

export default Card;
