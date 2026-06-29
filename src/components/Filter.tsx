import React, { useState, useEffect } from 'react';
import { Button, DatePicker, Select, Space, Typography } from 'antd';
import { FaFilter } from 'react-icons/fa';
import dayjs from 'dayjs';
import { useTheme } from '../context/ThemeContext';
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

function getMondayOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  return monday;
}

const Filter: React.FC<Props> = ({ onChange, teamOptions, staffOptions }) => {
  const { theme } = useTheme();
  const titleColor  = theme === 'dark' ? '#ffffff'  : '#0d2016';
  const labelColor  = theme === 'dark' ? '#d0e8f5'  : '#1a3d2c';
  const today = new Date();
  const currentMonday = getMondayOfWeek(new Date(today));
  const oneWeekAgo = new Date(currentMonday);
  oneWeekAgo.setDate(currentMonday.getDate() - 7);
  const [startDate, setStartDate] = useState<string | null>(formatDate(oneWeekAgo));
  const [endDate, setEndDate] = useState<string | null>(formatDate(currentMonday));
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  const filteredStaffOptions = selectedTeams.length === 1
    ? staffOptions.filter(opt => opt.team === selectedTeams[0])
    : [];

  const applyChange = (s: string | null, e: string | null, teams: string[], staff: string[]) => {
    if (s && e && new Date(e) < new Date(s)) {
      alert('End date cannot be before start date.');
      return;
    }
    setStartDate(s);
    setEndDate(e);
    onChange?.({ startDate: s, endDate: e }, teams, staff);
  };

  const setQuickRange = (months: number, weeks = 0) => {
    const now = new Date();
    const monday = getMondayOfWeek(new Date(now));
    const end = formatDate(monday);
    const start = new Date(monday);
    if (months) start.setMonth(start.getMonth() - months);
    if (weeks) start.setDate(start.getDate() - (weeks * 7) + 7);
    applyChange(formatDate(start), end, selectedTeams, selectedStaff);
  };

  const handleTeamsChange = (values: string[]) => {
    setSelectedTeams(values);
    applyChange(startDate, endDate, values, selectedStaff);
  };

  const handleStaffChange = (values: string[]) => {
    setSelectedStaff(values);
    applyChange(startDate, endDate, selectedTeams, values);
  };

  useEffect(() => {
    onChange?.({ startDate, endDate }, selectedTeams, selectedStaff);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const staffPlaceholder = selectedTeams.length === 0
    ? 'Select a team first'
    : selectedTeams.length > 1
      ? 'Select only one team to choose staff'
      : 'Select staff...';

  return (
    <div className="date-filter">
      <div className="filter-header">
        <div className="filter-header-left">
          <FaFilter className="section-icon" />
          <Typography.Text strong style={{ color: titleColor, fontSize: 15 }}>Filter</Typography.Text>
        </div>
      </div>

      <div className="date-filter-row">
        <Space size={10} align="center" wrap>
          <Typography.Text style={{ color: labelColor, fontSize: 13 }}>From</Typography.Text>
          <DatePicker
            value={startDate ? dayjs(startDate) : null}
            onChange={(date) => applyChange(date ? date.format('YYYY-MM-DD') : null, endDate, selectedTeams, selectedStaff)}
            format="DD/MM/YYYY"
            placeholder="From"
            style={{ width: 150 }}
            allowClear={false}
          />
          <Typography.Text style={{ color: labelColor, fontSize: 13 }}>To</Typography.Text>
          <DatePicker
            value={endDate ? dayjs(endDate) : null}
            onChange={(date) => applyChange(startDate, date ? date.format('YYYY-MM-DD') : null, selectedTeams, selectedStaff)}
            format="DD/MM/YYYY"
            placeholder="To"
            style={{ width: 150 }}
            allowClear={false}
          />
        </Space>
      </div>

      <div className="date-filter-dropdowns" style={{ display: 'flex', gap: 24, marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <Typography.Text style={{ display: 'block', marginBottom: 6, color: labelColor, fontSize: 13, fontWeight: 500 }}>Teams</Typography.Text>
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
          <Typography.Text style={{ display: 'block', marginBottom: 6, color: labelColor, fontSize: 13, fontWeight: 500 }}>Staff Members</Typography.Text>
          <Select
            mode="multiple"
            allowClear
            placeholder={staffPlaceholder}
            style={{ width: '100%' }}
            value={selectedStaff}
            onChange={handleStaffChange}
            options={filteredStaffOptions}
            disabled={selectedTeams.length !== 1}
          />
        </div>
      </div>

      <div className="date-filter-quick">
        <Typography.Text style={{ color: labelColor, fontWeight: 600, fontSize: 13, minWidth: 120, flexShrink: 0 }}>
          Quick Options:
        </Typography.Text>
        <Space size={8} wrap>
          <Button  shape="round" onClick={() => setQuickRange(0, 1)}>1 tuần</Button>
          <Button  shape="round" onClick={() => setQuickRange(1)}>1 tháng</Button>
          <Button  shape="round" onClick={() => setQuickRange(3)}>3 tháng</Button>
          <Button  shape="round" onClick={() => setQuickRange(6)}>6 tháng</Button>
          <Button  shape="round" danger onClick={() => applyChange(null, null, selectedTeams, selectedStaff)}>Xóa</Button>
        </Space>
      </div>
    </div>
  );
};

export default Filter;
