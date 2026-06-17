import { getTeamRankingByZone } from "./app/actions/ranking";

async function run() {
  const res = await getTeamRankingByZone();
  console.log(JSON.stringify(res, null, 2));
}
run();
