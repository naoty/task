import { GlobalRegistrator } from "@happy-dom/global-registrator";

// happy-dom が上書きする前にネイティブのWeb APIを保存する
const saved = {
  fetch: globalThis.fetch,
  Request: globalThis.Request,
  Response: globalThis.Response,
  Headers: globalThis.Headers,
  ReadableStream: globalThis.ReadableStream,
};

GlobalRegistrator.register();

// ネイティブのWeb APIを復元して、サーバーテストなど実際のHTTPリクエストを壊さないようにする
// UIコンポーネントテストでは spyOn で個別にモックする
Object.assign(globalThis, saved);
