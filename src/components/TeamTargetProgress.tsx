import React from "react";
import { Typography } from 'antd';
import { FaBullseye } from 'react-icons/fa';
import "./TeamTargetProgress.css";

export type WeeklyTeamPerformaceData = {
  name: string;
  total: number;
  target: number;
  base: number;
  creative: number;
}

function TeamCard({ team }: { team: WeeklyTeamPerformaceData }) {
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

const TeamTargetProgress: React.FC<{ teams: WeeklyTeamPerformaceData[] }> = ({ teams }) => {
  // Calculate Monday of the previous week
  const getPreviousMonday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days, else go back to Monday
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - daysToSubtract - 7); // Go back to previous week's Monday
    
    const day = lastMonday.getDate();
    const month = lastMonday.getMonth() + 1;
    const year = lastMonday.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="team-target-progress-container">
      <div className="team-target-header">
        <FaBullseye className="section-icon" style={{ marginRight: 8 }} />
        <Typography.Text strong className="team-target-title">Team's Target Progress</Typography.Text>
        <Typography.Text className="team-target-date">(Tuần gần nhất: {getPreviousMonday()})</Typography.Text>
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
