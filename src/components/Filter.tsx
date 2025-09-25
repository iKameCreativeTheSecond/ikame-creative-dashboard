
import React, { useState } from 'react';
import { Select } from 'antd';
import 'antd/dist/reset.css';
import './Filter.css';

type Range = {
  startDate: string | null;
  endDate: string | null;
};

type Props = {
  onChange?: (range: Range) => void;
  teamOptions: { value: string; label: string }[];
  staffOptions: { value: string; label: string; team: string }[];
};

function formatDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const Filter: React.FC<Props> = ({ onChange, teamOptions, staffOptions }) => {
  // Set default dates: startDate = 1 week before today, endDate = today
  const today = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(today.getDate() - 7);
  const [startDate, setStartDate] = useState<string | null>(formatDate(oneWeekAgo));
  const [endDate, setEndDate] = useState<string | null>(formatDate(today));
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  // Filter staff options based on selected team(s)
  const filteredStaffOptions = selectedTeams.length === 1
    ? staffOptions.filter(opt => opt.team === selectedTeams[0])
    : [];

  const applyChange = (s: string | null, e: string | null) => {
    if (s && e && new Date(e) < new Date(s)) {
      alert('End date cannot be before start date.');
      return;
    }
    setStartDate(s);
    setEndDate(e);
    onChange?.({ startDate: s, endDate: e });
  };

  const setQuickRange = (months: number, weeks = 0) => {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);
    if (months) {
      start.setMonth(start.getMonth() - months);
    }
    if (weeks) {
      start.setDate(start.getDate() - weeks * 7);
    }
    applyChange(formatDate(start), formatDate(end));
  };

  // Handlers for Ant Design Select
  const handleTeamsChange = (values: string[]) => {
    setSelectedTeams(values);
  };
  const handleStaffChange = (values: string[]) => {
    setSelectedStaff(values);
  };

  return (
    <div className="date-filter">
      <div className="date-filter-row">
        <label>
          Ngày bắt đầu
          <input
            type="date"
            value={startDate ?? ''}
            onChange={(e) => applyChange(e.target.value || null, endDate)}
          />
        </label>

        <label>
          Ngày kết thúc
          <input
            type="date"
            value={endDate ?? ''}
            onChange={(e) => applyChange(startDate, e.target.value || null)}
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
        <span>Lựa chọn nhanh:</span>
        <div className="quick-buttons">
          <button type="button" onClick={() => setQuickRange(0, 1)}>1 tuần</button>
          <button type="button" onClick={() => setQuickRange(1)}>1 tháng</button>
          <button type="button" onClick={() => setQuickRange(3)}>3 tháng</button>
          <button type="button" onClick={() => setQuickRange(6)}>6 tháng</button>
          <button
            type="button"
            className="clear"
            onClick={() => applyChange(null, null)}
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
};

export default Filter;
