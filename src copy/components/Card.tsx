import React from "react";

interface CardProps {
  children: any;
  className?: string;
  theme?: string;
}

const Card = ({ children, className = "", theme }: CardProps) => (
  <div
    className={`
    rounded-3xl h-full flex flex-col overflow-hidden relative
    transition-colors duration-300
    bg-white border-gray-200 shadow-md
    dark:bg-neutral-800/30 dark:border-white/10 dark:backdrop-blur-md
    ${className}
  `}
  >
    {children}
  </div>
);

export default Card;
