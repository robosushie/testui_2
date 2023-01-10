import * as savant from "oui-savant";
import { when, WhenMock, resetAllWhenMocks } from "jest-when";

// TODO: export this from savant-connector
const parseResponseHeaders = (response: Response): savant.SerializedHeaders => {
  const headers: Record<string, string> = {};
  response.headers &&
    response.headers.forEach((val: string, key: string) => {
      headers[key] = val;
    });

  return headers;
};

const serializeResponse = <T>(response: Response): savant.SerializableResponse => ({
  status: response.status,
  statusText: response.statusText,
  ok: response.ok,
  headers: parseResponseHeaders(response),
});

type ResponseMocks<Args, Resp> = Resp extends Response
  ? {
      mockResponse(response: Resp): TypedQueryMock<Args, Resp>;
      mockResponseOnce(response: Resp): TypedQueryMock<Args, Resp>;
    }
  : {
      mockResponse(data: Resp, response?: Response): TypedQueryMock<Args, Resp>;
      mockResponseOnce(data: Resp, response?: Response): TypedQueryMock<Args, Resp>;
    };

type TypedQueryMock<Args, Resp> = WhenMock &
  ResponseMocks<Args, Resp> & {
    withArguments(args: Partial<Args>): TypedQueryMock<Args, Resp>;

    mockLoading(): TypedQueryMock<Args, Resp>;
    mockLoadingOnce(): TypedQueryMock<Args, Resp>;

    mockError(error: savant.NormalError, resp?: Response): TypedQueryMock<Args, Resp>;
    mockErrorOnce(error: savant.NormalError, resp?: Response): TypedQueryMock<Args, Resp>;

    refresh: jest.Mock;
  };

export type QueryMock<Method> = Method extends (
  args: infer Args
) => Promise<savant.ResponseWithData<infer Resp>>
  ? TypedQueryMock<Args, Resp>
  : Method extends (args: infer Args) => Promise<infer Resp>
  ? TypedQueryMock<Args, Resp>
  : never;

const default200Resp: ResponseInit = {
  status: 204,
  headers: {},
};

const simpleDeepEqual = (a: any, b: any): boolean => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every((k) => {
    const aVal = a[k];
    const bVal = b[k];

    if (aVal.constructor === Date && bVal.constructor === Date) {
      return aVal.getTime() === bVal.getTime();
    }

    if (typeof aVal === "object" && typeof bVal === "object") {
      return simpleDeepEqual(aVal, bVal);
    }

    return aVal === bVal;
  });
};

const isSubObjectMatch = <Args>(args: Args, partial: Partial<Args>) => {
  return Object.keys(partial).every((key) => {
    const argVal = (args as any)[key];
    const partialVal = (partial as any)[key];

    return simpleDeepEqual(argVal, partialVal);
  });
};

const createQueryMock = <Args, Resp>(
  spy: jest.SpyInstance,
  method: savant.QueryMethod<Args, Resp>,
  args?: Partial<Args>
): TypedQueryMock<Args, Resp> => {
  const whenMock = when(spy).calledWith(
    when(((query: savant.Query<Args, Resp>) => {
      if (query.method !== method) {
        return false;
      }

      if (args) {
        return isSubObjectMatch(query.options.args, args);
      }

      return true;
    }) as unknown as jest.MockInstance<unknown, any>)
  );

  const refresh = jest.fn();

  const loadingResponse = (): savant.QueryResult<any> => ({
    refresh,
    loading: true,
  });

  const dataResponse = (value: Resp, resp?: Response): savant.QueryResult<Resp> => {
    let response: any;
    if (value instanceof Response) {
      response = serializeResponse(value);
    } else {
      response = {
        data: value,
        response: serializeResponse(resp || new Response(null, default200Resp)),
      };
    }

    return {
      refresh,
      response,
      loading: false,
    };
  };

  const errorResponse = (err: savant.NormalError, resp?: Response): savant.QueryResult<Resp> => ({
    refresh,
    loading: false,
    error: err,
    response: resp && (serializeResponse(resp) as any),
  });

  const result: TypedQueryMock<Args, Resp> = Object.assign(whenMock, {
    refresh,

    withArguments: (args: Partial<Args>) => createQueryMock(spy, method, args),

    mockLoading: () => {
      whenMock.mockReturnValue(loadingResponse());
      return result;
    },

    mockLoadingOnce: () => {
      whenMock.mockReturnValueOnce(loadingResponse());
      return result;
    },

    mockError: (err: savant.NormalError, resp?: Response) => {
      whenMock.mockReturnValue(errorResponse(err, resp));
      return result;
    },

    mockErrorOnce: (err: savant.NormalError, resp?: Response) => {
      whenMock.mockReturnValueOnce(errorResponse(err, resp));
      return result;
    },

    mockResponse: (value: Resp, resp?: Response) => {
      whenMock.mockReturnValue(dataResponse(value, resp));
      return result;
    },

    mockResponseOnce: (value: Resp, resp?: Response) => {
      whenMock.mockReturnValueOnce(dataResponse(value, resp));
      return result;
    },
  }) as any;

  return result;
};

const errors = <T extends { [name: string]: savant.NormalError }>(obj: T): T => obj;
export const Errors = errors({
  NotFound: {
    status: 404,
    body: {
      message: "Thing was not found or not authorized",
      code: "NotFoundOrNotAuthorized",
    },
  },
  ISE: {
    status: 500,
    body: {
      message: "An internal error has occurred",
      code: "InternalServiceError",
    },
  },
});

export const mockQuery = <Args, Resp>(
  method: savant.QueryMethod<Args, Resp>
): TypedQueryMock<Args, Resp> => {
  return createQueryMock(jest.spyOn(savant, "useQuery"), method);
};

export const cleanupMockConnector = resetAllWhenMocks;
