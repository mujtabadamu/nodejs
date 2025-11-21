

const errorHandler = (err: Error, req: any, res: any, next: Function) => {
  console.error(err.stack);
  res.status(500).send({
    status: 500,
    message: "Something went wrong!",
    error: err.message,
  });
}

export default errorHandler;