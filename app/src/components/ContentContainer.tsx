import React from "react";

interface Props {
  children: React.ReactNode;
}

export const ContentContainer = ({ children }: Props) => {
  return <div className="">{children}</div>;
};
