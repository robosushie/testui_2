/**
 * Very simple mocking helper for XHR/ajax requests
 * Need per calls, and teardown() after each tests
 */

const oldXMLHttpRequest = ((global || window) as any).XMLHttpRequest;

// tslint:disable object-literal-shorthand
export function setup(url: string, status: number, body: string = ""): void {
  ((global || window) as any).XMLHttpRequest = jest.fn(() => ({
    open: function (_: string, openUrl: string): void {
      this.status = openUrl === url ? status : 404;
    },
    send: function (): void {
      this.responseText = body;
      this.onreadystatechange();
    },
    setRequestHeader: function (): void {},
    readyState: 4,
  }));
}

export function teardown(): void {
  ((global || window) as any).XMLHttpRequest = oldXMLHttpRequest;
}
