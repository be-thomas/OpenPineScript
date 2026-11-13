// The files the practice terminal starts with. No DOM: the test harness imports this too.

import { Vfs, HOME } from "./shell.js";

export const EXAMPLES = ["rsi.pine", "sma_cross.pine", "broken.pine"];
export const DATA = "mock_data/common/AAPL_mock.csv";

/** The starting file system. `examples` maps file name -> text; `aapl` is the CSV text. */
export function seedVfs({ examples, aapl }) {
  const v = new Vfs();
  for (const [name, text] of Object.entries(examples)) v.write(`${HOME}/examples/${name}`, text);
  v.write(`${HOME}/${DATA}`, aapl);
  v.mkdirp(`${HOME}/results`);   // --out-chart does not create folders, so lesson 2 works first time
  return v;
}
