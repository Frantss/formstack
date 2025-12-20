export const get = <Data>(data: Data, path: (string | number)[]) => {
  return path.reduce((acc, key) => {
    return (acc as any)[key] as any;
  }, data);
};
