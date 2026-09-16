export function Alert({ children, ...props }: any) {
  return <div {...props}>{children}</div>;
}
export function AlertDescription({ children, ...props }: any) {
  return <p {...props}>{children}</p>;
}
