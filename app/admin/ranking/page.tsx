import { getTeamRankingByZone } from "@/app/actions/ranking"
import type { Zone } from "@/app/types"

interface RankingPageProps {
  searchParams: { zone?: Zone }
}

async function RankingPage({ searchParams }: RankingPageProps) {
  const zone = searchParams.zone || "A" // Default to Zone A if not provided
  const ranking = await getTeamRankingByZone(zone)

  return (
    <div>
      <h1>Ranking for Zone {zone}</h1>
      {ranking && ranking.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Team</th>
              <th>Points</th>
              {/* Add more columns as needed */}
            </tr>
          </thead>
          <tbody>
            {ranking.map((team) => (
              <tr key={team.teamId}>
                <td>{team.teamName}</td>
                <td>{team.points}</td>
                {/* Add more data cells as needed */}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No ranking data available for Zone {zone}.</p>
      )}
    </div>
  )
}

export default RankingPage
