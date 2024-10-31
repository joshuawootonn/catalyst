'use client';

import React, { useState, ReactElement } from 'react';
import { StarEmptyIcon } from './star-icons/star-empty';
import { StarFilledIcon } from './star-icons/star-filled';
import { StarHalfIcon } from './star-icons/star-half';

const MAX_RATING = 5;
const roundHalf = (num: number) => {
  return Math.round(num * 2) / 2;
};

interface Props {
  className?: string;
  rating: number;
  size?: number;
  onChange?: (rating: number) => void;
}

const Rating = ({ className, rating, size = 24, onChange }: Props) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const stars: ReactElement[] = [];
  const roundedRating = roundHalf(hoverRating ?? rating);

  const handleMouseEnter = (index: number) => {
    setHoverRating(index);
  };

  const handleMouseLeave = () => {
    setHoverRating(null);
  };

  const handleClick = (index: number) => {
    if (onChange) {
      onChange(index);
    }
  };

  for (let i = 1; i <= MAX_RATING; i += 1) {
    if (roundedRating - i >= 0) {
      stars.push(
        <StarFilledIcon
          height={size}
          key={i}
          width={size}
          onMouseEnter={() => handleMouseEnter(i)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(i)}
        />,
      );
    } else if (roundedRating - i > -1) {
      stars.push(
        <StarHalfIcon
          height={size}
          key={i}
          width={size}
          onMouseEnter={() => handleMouseEnter(i)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(i)}
        />,
      );
    } else {
      stars.push(
        <StarEmptyIcon
          height={size}
          key={i}
          width={size}
          onMouseEnter={() => handleMouseEnter(i)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(i)}
        />,
      );
    }
  }

  return (
    <span className={`inline-flex fill-current ${className}`} role="img">
      {stars}
    </span>
  );
};

Rating.displayName = 'Rating';

export { Rating };
