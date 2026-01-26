'use client';

import { useState } from 'react';
import {
  getTodayDate,
  getTomorrowDate,
  getWeekendDates,
  getTodayDayKey,
  getTomorrowDayKey,
  getWeekendDayKeys,
  getDayKeyFromDate,
} from '@/lib/utils/explore-date';

export type PostType = 'support' | 'challenge' | 'all';
export type LocationFilter = 'all' | 'online' | 'offline';
export type QuickDateFilter = 'today' | 'tomorrow' | 'weekend' | null;

export interface ExploreFilters {
  type: PostType;
  categoryId: number | null;
  searchQuery: string;
  posterLevelMin: number;
  posterLevelMax: number;
  myLevelFilter: number | null;
  selectedDays: string[];
  selectedTimes: string[];
  locationFilter: LocationFilter;
  quickDateFilter: QuickDateFilter;
  targetDates: string[];
  selectedTags: string[];
  includeClosed: boolean;
  hideApplied: boolean;
}

export function useExploreFilters(initialSearch: string = '', initialType: PostType = 'all', initialCategory: number | null = null) {
  const [type, setType] = useState<PostType>(initialType);
  const [categoryId, setCategoryId] = useState<number | null>(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [posterLevelMin, setPosterLevelMin] = useState(0);
  const [posterLevelMax, setPosterLevelMax] = useState(10);
  const [myLevelFilter, setMyLevelFilter] = useState<number | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all');
  const [quickDateFilter, setQuickDateFilter] = useState<QuickDateFilter>(null);
  const [targetDates, setTargetDates] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [includeClosed, setIncludeClosed] = useState(false);
  const [hideApplied, setHideApplied] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const handleQuickDateFilter = (filter: 'today' | 'tomorrow' | 'weekend') => {
    setShowDatePicker(false);
    if (quickDateFilter === filter) {
      setQuickDateFilter(null);
      setSelectedDays([]);
      setTargetDates([]);
    } else {
      setQuickDateFilter(filter);
      switch (filter) {
        case 'today':
          setSelectedDays([getTodayDayKey()]);
          setTargetDates([getTodayDate()]);
          break;
        case 'tomorrow':
          setSelectedDays([getTomorrowDayKey()]);
          setTargetDates([getTomorrowDate()]);
          break;
        case 'weekend':
          setSelectedDays(getWeekendDayKeys());
          setTargetDates(getWeekendDates());
          break;
      }
    }
  };

  const handleDateSelect = (dateStr: string) => {
    setQuickDateFilter(null);
    if (targetDates.includes(dateStr)) {
      const newDates = targetDates.filter(d => d !== dateStr);
      setTargetDates(newDates);
      setSelectedDays(newDates.map(d => getDayKeyFromDate(d)));
    } else {
      const newDates = [...targetDates, dateStr];
      setTargetDates(newDates);
      setSelectedDays(newDates.map(d => getDayKeyFromDate(d)));
    }
  };

  const toggleDay = (day: string) => {
    setQuickDateFilter(null);
    setTargetDates([]);
    setShowDatePicker(false);
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const toggleTime = (time: string) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time));
    } else {
      setSelectedTimes([...selectedTimes, time]);
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const clearFilters = () => {
    setType('all');
    setCategoryId(null);
    setSearchQuery('');
    setPosterLevelMin(0);
    setPosterLevelMax(10);
    setMyLevelFilter(null);
    setSelectedDays([]);
    setSelectedTimes([]);
    setLocationFilter('all');
    setQuickDateFilter(null);
    setTargetDates([]);
    setShowDatePicker(false);
    setSelectedTags([]);
    setTagInput('');
  };

  const hasActiveFilters = 
    type !== 'all' || 
    categoryId !== null || 
    searchQuery !== '' || 
    posterLevelMin > 0 || 
    posterLevelMax < 10 || 
    myLevelFilter !== null || 
    selectedDays.length > 0 || 
    selectedTimes.length > 0 || 
    locationFilter !== 'all' || 
    selectedTags.length > 0;

  return {
    // State
    type,
    categoryId,
    searchQuery,
    posterLevelMin,
    posterLevelMax,
    myLevelFilter,
    selectedDays,
    selectedTimes,
    locationFilter,
    quickDateFilter,
    targetDates,
    selectedTags,
    includeClosed,
    hideApplied,
    showDatePicker,
    tagInput,
    hasActiveFilters,
    // Setters
    setType,
    setCategoryId,
    setSearchQuery,
    setPosterLevelMin,
    setPosterLevelMax,
    setMyLevelFilter,
    setLocationFilter,
    setIncludeClosed,
    setHideApplied,
    setShowDatePicker,
    setTagInput,
    // Handlers
    handleQuickDateFilter,
    handleDateSelect,
    toggleDay,
    toggleTime,
    addTag,
    removeTag,
    clearFilters,
  };
}