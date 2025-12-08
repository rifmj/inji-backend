export const assertParamExists = (paramName: string, paramValue: unknown) => {
  if (paramValue === null || paramValue === undefined) {
    throw new Error(
      `Required parameter ${paramName} was null or undefined when calling.`,
    );
  }
};
