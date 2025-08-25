#!/usr/bin/env ts-node

import { loadPDFs } from "./vectorStore.ts";

(async () => {
  await loadPDFs();
})();
