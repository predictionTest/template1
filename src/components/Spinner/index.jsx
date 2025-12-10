import React from 'react';
import styled, { keyframes } from 'styled-components';
import Paper from '@mui/material/Paper';

const rotate1 = keyframes`
  from {
    transform: rotateX(35deg) rotateY(-45deg) rotateZ(0);
  }
  to {
    transform: rotateX(35deg) rotateY(-45deg) rotateZ(1turn);
  }
`;

const rotate2 = keyframes`
  from {
    transform: rotateX(50deg) rotateY(10deg) rotateZ(0);
  }
  to {
    transform: rotateX(50deg) rotateY(10deg) rotateZ(1turn);
  }
`;

const rotate3 = keyframes`
  from {
    transform: rotateX(35deg) rotateY(55deg) rotateZ(0);
  }
  to {
    transform: rotateX(35deg) rotateY(55deg) rotateZ(1turn);
  }
`;

const LoadingContainer = styled(Paper)`
  position: relative;
  width: 4rem;
  height: 4rem;
  transform-style: preserve-3d;
  perspective: 800px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #30333c; 
  border-radius: 50%;
`;

const Arc = styled.div`
  position: absolute;
  content: '';
  width: 100%;
  height: 100%;
  color:blue;
  border-radius: 50%;
  border-bottom: 4px solid ;

  &:nth-child(1) {
    animation: ${rotate1} 1.15s linear infinite;
    animation-delay: -1.6s;
  }

  &:nth-child(2) {
    animation: ${rotate2} 1.15s linear infinite;
    animation-delay: -0.8s;
  }

  &:nth-child(3) {
    animation: ${rotate3} 1.15s linear infinite;
    animation-delay: 0s;
  }
`;

function LoadingAnimation() {
  return (
    <LoadingContainer>
      <Arc />
      <Arc />
      <Arc />
    </LoadingContainer>
  );
}

export default LoadingAnimation;
