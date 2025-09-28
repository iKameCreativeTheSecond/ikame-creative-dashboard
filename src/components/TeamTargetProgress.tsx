import React from "react";
import "./TeamTargetProgress.css";

export type TeamData = {
  name: string;
  total: number;
  target: number;
  base: number;
  creative: number;
}

function TeamCard({ team }: { team: TeamData }) {
  const percent = Math.round((team.total / team.target) * 100);
  return (
    <div className="team-card">
      <div className="team-title">{team.name}</div>
      <div className="team-total">{team.total}</div>
      <div className="team-target-row">
        <span className="team-target-label">Target: {team.target}</span>
        <span className="team-percent">{percent}%</span>
      </div>
      <div className="team-progress-bar">
        <div
          className="team-progress-base"
          style={{ width: `${(team.base / team.target) * 100}%` }}
        />
        <div
          className="team-progress-creative"
          style={{ width: `${(team.creative / team.target) * 100}%` }}
        />
        <div
          className="team-progress-remaining"
          style={{ width: `${100 - ((team.base + team.creative) / team.target) * 100}%` }}
        />
      </div>
      <div className="team-progress-labels">
        <span className="team-base-label">Base: {team.base}</span>
        <span className="team-creative-label">Creative: {team.creative}</span>
      </div>
    </div>
  );
}

const TeamTargetProgress: React.FC<{ teams: TeamData[] }> = ({ teams }) => {
  return (
    <div className="team-target-progress-container">
      <div className="team-target-header">
        <span className="team-target-icon">🎯</span>
        <span className="team-target-title">Team's Target Progress</span>
        <span className="team-target-date">(Tuần gần nhất: 21/9/2025)</span>
      </div>
      <div className="team-cards-row">
        {teams.map((team) => (
          <TeamCard key={team.name} team={team} />
        ))}
      </div>
    </div>
  );
};

export default TeamTargetProgress;
