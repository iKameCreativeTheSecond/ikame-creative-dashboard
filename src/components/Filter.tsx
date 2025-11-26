
import React, { useState, useEffect } from 'react';
import { Select } from 'antd';
import 'antd/dist/reset.css';
import './Filter.css';

type Range = {
  startDate: string | null;
  endDate: string | null;
};

type TeamOption = {
  value: string;
  label: string;
}

type StaffOption = {
  value: string;
  label: string;
  team: string;
};

type Props = {
  onChange?: (range: Range, selectedTeams: string[], selectedStaff: string[]) => void;
  teamOptions: TeamOption[];
  staffOptions: StaffOption[];
};

function formatDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Helper function to get Monday of current week
function getMondayOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  return monday;
}

const Filter: React.FC<Props> = ({ onChange, teamOptions, staffOptions }) => {
  // Set default dates: startDate = 1 week before Monday, endDate = Monday of current week
  const today = new Date();
  const currentMonday = getMondayOfWeek(new Date(today));
  const oneWeekAgo = new Date(currentMonday);
  oneWeekAgo.setDate(currentMonday.getDate() - 7);
  const [startDate, setStartDate] = useState<string | null>(formatDate(oneWeekAgo));
  const [endDate, setEndDate] = useState<string | null>(formatDate(currentMonday));
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  // Filter staff options based on selected team(s)
  const filteredStaffOptions = selectedTeams.length === 1
    ? staffOptions.filter(opt => opt.team === selectedTeams[0])
    : [];

  const applyChange = (s: string | null, e: string | null, selectedTeams: string[], selectedStaff: string[]) => {
    if (s && e && new Date(e) < new Date(s)) {
      alert('End date cannot be before start date.');
      return;
    }
    setStartDate(s);
    setEndDate(e);
    onChange?.({ startDate: s, endDate: e }, selectedTeams, selectedStaff);
  };

  const setQuickRange = (months: number, weeks = 0) => {
    const now = new Date();
    const currentMonday = getMondayOfWeek(new Date(now));
    const end = formatDate(currentMonday);
    
    const start = new Date(currentMonday);
    if (months) {
      start.setMonth(start.getMonth() - months);
    }
    if (weeks) {
      start.setDate(start.getDate() - (weeks * 7) + 7); // +7 to include current week
    }
    applyChange(formatDate(start), end, selectedTeams, selectedStaff);
  };

  // Handlers for Ant Design Select
  const handleTeamsChange = (values: string[]) => {
    setSelectedTeams(values);
    applyChange(startDate, endDate, values, selectedStaff); // Clear selected staff when teams change
  };
  const handleStaffChange = (values: string[]) => {
    setSelectedStaff(values);
    applyChange(startDate, endDate, selectedTeams, values);
  };

  // Call onChange on mount with initial default values
  useEffect(() => {
    onChange?.({ startDate, endDate }, selectedTeams, selectedStaff);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="date-filter">
      <div className="filter-header">
        <div className="filter-header-left">
          <svg
            className="filter-header-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M3 5a1 1 0 011-1h16a1 1 0 01.8 1.6l-6.2 8.27a1 1 0 00-.2.6V19a1 1 0 01-.55.9l-3 1.5A1 1 0 019 20.5v-5.03a1 1 0 00-.2-.6L2.2 6.6A1 1 0 013 5z"
              fill="#5F6D7A"
            />
          </svg>
          <span className="filter-header-title">Filter</span>
        </div>
      </div>
      <div className="date-filter-row">
        <label>
          From
          <input
            type="date"
            value={startDate ?? ''}
            onChange={(e) => applyChange(e.target.value || null, endDate, selectedTeams, selectedStaff)}
          />
        </label>

        <label>
          To
          <input
            type="date"
            value={endDate ?? ''}
            onChange={(e) => applyChange(startDate, e.target.value || null, selectedTeams, selectedStaff)}
          />
        </label>
      </div>

      {/* Multi-select dropdown filters styled like Ant Design */}
      <div className="date-filter-dropdowns" style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>Teams</label>
          <Select
            mode="multiple"
            allowClear
            placeholder="Select teams..."
            style={{ width: '100%' }}
            value={selectedTeams}
            onChange={handleTeamsChange}
            options={teamOptions}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>Staff Members</label>
          <Select
            mode="multiple"
            allowClear
            placeholder={selectedTeams.length === 0 ? "Select a team first" : selectedTeams.length > 1 ? "Select only one team to choose staff" : "Select staff..."}
            style={{ width: '100%' }}
            value={selectedStaff}
            onChange={handleStaffChange}
            options={filteredStaffOptions}
            disabled={selectedTeams.length !== 1}
          />
        </div>
      </div>

      <div className="date-filter-quick">
        <span>Quick Options:</span>
        <div className="quick-buttons">
          <button type="button" onClick={() => setQuickRange(0, 1)}>1 tuần</button>
          <button type="button" onClick={() => setQuickRange(1)}>1 tháng</button>
          <button type="button" onClick={() => setQuickRange(3)}>3 tháng</button>
          <button type="button" onClick={() => setQuickRange(6)}>6 tháng</button>
          <button
            type="button"
            className="clear"
            onClick={() => applyChange(null, null, selectedTeams, selectedStaff)}
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
};

export default Filter;
