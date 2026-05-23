import React, { useState } from "react";
import { CategoryConfig, CategoryOption, AVAILABLE_ICONS, AVAILABLE_COLORS } from "../types";
import LucideIcon from "./LucideIcon";

interface ManageTabProps {
  config: CategoryConfig;
  onUpdateConfig: (updatedConfig: CategoryConfig) => void;
}

type CategoryType = "moods" | "energies" | "resistances" | "fears" | "activities";

export default function ManageTab({ config, onUpdateConfig }: ManageTabProps) {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<CategoryType>("moods");
  const [editingItem, setEditingItem] = useState<CategoryOption | null>(null);

  // Form states inside modal
  const [formLabel, setFormLabel] = useState("");
  const [formIcon, setFormIcon] = useState("sentiment_satisfied");
  const [formColor, setFormColor] = useState("happy");

  const categoryLabels: Record<CategoryType, string> = {
    moods: "Mood",
    energies: "Energy Level",
    resistances: "Resistance State",
    fears: "Fear Level",
    activities: "Activity Type",
  };

  const openAddModal = (type: CategoryType) => {
    setEditingType(type);
    setEditingItem(null);
    setFormLabel("");
    
    // Choose standard safe default icons for new additions
    const defaultIcons: Record<CategoryType, string> = {
      moods: "sentiment_satisfied",
      energies: "battery_4_bar",
      resistances: "waves",
      fears: "verified_user",
      activities: "work",
    };
    setFormIcon(defaultIcons[type]);

    const defaultColors: Record<CategoryType, string> = {
      moods: "happy",
      energies: "normal",
      resistances: "flow",
      fears: "fearless",
      activities: "activity-work",
    };
    setFormColor(defaultColors[type]);

    setIsModalOpen(true);
  };

  const openEditModal = (type: CategoryType, item: CategoryOption) => {
    setEditingType(type);
    setEditingItem(item);
    setFormLabel(item.label);
    setFormIcon(item.icon);
    setFormColor(item.colorClass);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formLabel.trim()) {
      alert("Please enter a label name!");
      return;
    }

    const currentList = config[editingType] as CategoryOption[];
    let updatedList: CategoryOption[];

    if (editingItem) {
      // Editing Mode
      updatedList = currentList.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            label: formLabel,
            icon: formIcon,
            colorClass: formColor,
          };
        }
        return item;
      });
    } else {
      // Adding Mode
      const newId = `custom_${Date.now()}`;
      const newItem: CategoryOption = {
        id: newId,
        label: formLabel,
        icon: formIcon,
        colorClass: formColor,
        bgClass: `bg-[#dee9fc] text-[#4648d4]`, // custom category visual styling
      };
      updatedList = [...currentList, newItem];
    }

    onUpdateConfig({
      ...config,
      [editingType]: updatedList,
    });

    setIsModalOpen(false);
  };

  const handleDelete = (type: CategoryType, id: string) => {
    const list = config[type] as CategoryOption[];
    
    if (list.length <= 1) {
      alert("Bhai, at least one option must remain in this category to avoid charting issues!");
      return;
    }

    if (confirm(`Are you sure you want to delete this option? Daily logs referencing this option will still keep the records.`)) {
      const updatedList = list.filter(item => item.id !== id);
      onUpdateConfig({
        ...config,
        [type]: updatedList,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="space-y-0.5">
        <h2 className="text-[#121c2a] dark:text-white text-lg font-black tracking-tight font-sans">Manage Blueprint Settings</h2>
        <p className="text-[#464554] dark:text-slate-350 text-xs">Customize options in your daily check-ins</p>
      </div>

      {/* Mood category */}
      <section className="space-y-2.5">
        <div>
          <h3 className="text-sm font-black text-[#121c2a] dark:text-white tracking-tight">Mood</h3>
          <p className="text-[10px] text-[#464554] dark:text-slate-400">How are you feeling?</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in space-y-0">
          {config.moods.map((item) => (
            <div
              key={item.id}
              className="chunky-card bg-white dark:bg-[#121214] border-2 border-[#c7c4d7] dark:border-[#2d2d30] p-2.5 rounded-xl flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-grow">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[#121c2a] dark:text-[#eab308] shrink-0">
                  <LucideIcon name={item.icon} size={16} />
                </div>
                <span className="font-bold text-xs text-[#121c2a] dark:text-white truncate">{item.label}</span>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditModal("moods", item)}
                  className="p-1 px-2 text-[#121c2a] dark:text-[#eab308] hover:bg-[#eff4ff] dark:hover:bg-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete("moods", item.id)}
                  className="p-1 px-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => openAddModal("moods")}
          className="w-full py-2.5 border-2 border-dashed border-[#c7c4d7] dark:border-[#2d2d30] hover:border-[#121c2a] dark:hover:border-[#eab308] text-[#121c2a] dark:text-slate-300 dark:hover:text-[#eab308] font-black text-xs rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition-colors cursor-pointer"
        >
          <span>Add Mood Category</span>
        </button>
      </section>

      {/* Energy Level category */}
      <section className="space-y-2.5">
        <div>
          <h3 className="text-sm font-black text-[#121c2a] dark:text-white tracking-tight">Energy</h3>
          <p className="text-[10px] text-[#464554] dark:text-slate-400">What's your battery level?</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {config.energies.map((item) => (
            <div
              key={item.id}
              className="chunky-card bg-white dark:bg-[#121214] border-2 border-[#c7c4d7] dark:border-[#2d2d30] p-3 rounded-xl flex flex-col items-center justify-center text-center relative group min-w-0"
            >
              <LucideIcon name={item.icon} className="text-[#121c2a] dark:text-[#eab308] mb-1.5 shrink-0" size={20} />
              <span className="font-bold text-[#121c2a] dark:text-white text-xs truncate w-full">{item.label}</span>
              
              <div className="flex gap-2 mt-2 w-full justify-center shrink-0">
                <button
                  type="button"
                  onClick={() => openEditModal("energies", item)}
                  className="text-[10px] font-black hover:underline text-slate-500 dark:text-slate-400 hover:text-[#121c2a] dark:hover:text-[#eab308] cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete("energies", item.id)}
                  className="text-[10px] font-black hover:underline text-slate-500 dark:text-slate-400 hover:text-red-500 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => openAddModal("energies")}
          className="w-full py-2.5 border-2 border-dashed border-[#c7c4d7] dark:border-[#2d2d30] hover:border-[#121c2a] dark:hover:border-[#eab308] text-[#121c2a] dark:text-slate-300 dark:hover:text-[#eab308] font-black text-xs rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition-colors cursor-pointer"
        >
          <span>Add Energy Category</span>
        </button>
      </section>

      {/* Resistance State category */}
      <section className="space-y-2.5">
        <div>
          <h3 className="text-sm font-black text-[#121c2a] dark:text-white tracking-tight">Resistance</h3>
          <p className="text-[10px] text-[#464554] dark:text-slate-400">Are you pushing or flowing?</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 space-y-0">
          {config.resistances.map((item) => (
            <div key={item.id} className="chunky-card bg-white dark:bg-[#121214] border-2 border-[#c7c4d7] dark:border-[#2d2d30] p-2.5 rounded-xl flex items-center justify-between min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <LucideIcon name={item.icon} className="text-[#121c2a] dark:text-[#eab308] shrink-0" size={16} />
                <span className="font-bold text-xs text-[#121c2a] dark:text-white truncate">{item.label}</span>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditModal("resistances", item)}
                  className="p-1 px-2 text-[#121c2a] dark:text-[#eab308] hover:bg-[#eff4ff] dark:hover:bg-slate-800 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete("resistances", item.id)}
                  className="p-1 px-2 text-red-500 hover:bg-neutral-100 dark:hover:bg-slate-800 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => openAddModal("resistances")}
          className="w-full py-2.5 border-2 border-dashed border-[#c7c4d7] dark:border-[#2d2d30] hover:border-[#121c2a] dark:hover:border-[#eab308] text-[#121c2a] dark:text-slate-300 dark:hover:text-[#eab308] font-black text-xs rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <span>Add Resistance Category</span>
        </button>
      </section>

      {/* Fear category */}
      <section className="space-y-2.5">
        <div>
          <h3 className="text-sm font-black text-[#121c2a] dark:text-white tracking-tight">Fear</h3>
          <p className="text-[10px] text-[#464554] dark:text-slate-400">Face your shadows</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 space-y-0">
          {config.fears.map((item) => (
            <div key={item.id} className="chunky-card bg-white dark:bg-[#121214] border-2 border-[#c7c4d7] dark:border-[#2d2d30] p-2.5 rounded-xl flex items-center justify-between min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <LucideIcon name={item.icon} className="text-[#121c2a] dark:text-[#eab308] shrink-0" size={16} />
                <span className="font-bold text-xs text-[#121c2a] dark:text-white truncate">{item.label}</span>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditModal("fears", item)}
                  className="p-1 px-2 text-[#121c2a] dark:text-[#eab308] hover:bg-[#eff4ff] dark:hover:bg-slate-800 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete("fears", item.id)}
                  className="p-1 px-2 text-red-500 hover:bg-neutral-100 dark:hover:bg-slate-800 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => openAddModal("fears")}
          className="w-full py-2.5 border-2 border-dashed border-[#c7c4d7] dark:border-[#2d2d30] hover:border-[#121c2a] dark:hover:border-[#eab308] text-[#121c2a] dark:text-slate-300 dark:hover:text-[#eab308] font-black text-xs rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <span>Add Fear Category</span>
        </button>
      </section>

      {/* Activities category */}
      <section className="space-y-2.5">
        <div>
          <h3 className="text-sm font-black text-[#121c2a] dark:text-white tracking-tight">Activities</h3>
          <p className="text-[10px] text-[#464554] dark:text-slate-400">Daily routine tasks</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 space-y-0">
          {config.activities.map((item) => (
            <div key={item.id} className="chunky-card bg-white dark:bg-[#121214] border-2 border-[#c7c4d7] dark:border-[#2d2d30] p-2.5 rounded-xl flex items-center justify-between min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <LucideIcon name={item.icon} className="text-[#121c2a] dark:text-[#eab308] shrink-0" size={16} />
                <span className="font-bold text-xs text-[#121c2a] dark:text-white truncate">{item.label}</span>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditModal("activities", item)}
                  className="p-1 px-2 text-[#121c2a] dark:text-[#eab308] hover:bg-[#eff4ff] dark:hover:bg-slate-800 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete("activities", item.id)}
                  className="p-1 px-2 text-red-500 hover:bg-neutral-100 dark:hover:bg-slate-800 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => openAddModal("activities")}
          className="w-full py-2.5 border-2 border-dashed border-[#c7c4d7] dark:border-[#2d2d30] hover:border-[#121c2a] dark:hover:border-[#eab308] text-[#121c2a] dark:text-slate-300 dark:hover:text-[#eab308] font-black text-xs rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <span>Add New Activity Type</span>
        </button>
      </section>

      {/* Edit Category option Modal Popup dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-[360px] bg-white dark:bg-[#121214] rounded-2xl border-2 border-black dark:border-[#2d2d30] p-5 space-y-4 shadow-[4px_4px_0_0_#121c2a] dark:shadow-[4px_4px_0_0_#000000]">
            <div>
              <h3 className="text-base font-black text-[#121c2a] dark:text-white">
                {editingItem ? "Edit Option" : "Add New Option"}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                Customize label, icon, and colors for {categoryLabels[editingType]}
              </p>
            </div>

            {/* Label input */}
            <div className="space-y-1">
              <label htmlFor="modal-label" className="text-[9px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">Option Title/Label</label>
              <input
                id="modal-label"
                type="text"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="e.g. Reading, Stressed, Excited"
                className="w-full bg-[#f8f9ff] dark:bg-[#18181b] text-[#121c2a] dark:text-white border-2 border-[#c7c4d7] dark:border-[#2d2d30] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#121c2a] dark:focus:border-[#eab308]"
              />
            </div>

            {/* Icon Picker dropdown list */}
            <div className="space-y-1">
              <label htmlFor="modal-icon" className="text-[9px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider block mb-1">Select Icon</label>
              <div className="grid grid-cols-6 gap-1.5 max-h-[120px] overflow-y-auto p-1.5 bg-[#f8f9ff] dark:bg-[#18181b] rounded-xl border border-slate-200 dark:border-slate-800">
                {AVAILABLE_ICONS.map(ic => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setFormIcon(ic)}
                    className={`p-1.5 rounded-lg flex items-center justify-center border ${
                      formIcon === ic ? "bg-[#eff4ff] dark:bg-[#252529] border-[#121c2a] dark:border-[#eab308] text-[#121c2a] dark:text-[#eab308]" : "border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    <LucideIcon name={ic} size={15} />
                  </button>
                ))}
              </div>
            </div>

            {/* Color Accent Class dropdown selector */}
            <div className="space-y-1">
              <label htmlFor="modal-color" className="text-[9px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">Color Palette</label>
              <select
                id="modal-color"
                value={formColor}
                onChange={(e) => setFormColor(e.target.value)}
                className="w-full text-xs bg-[#f8f9ff] dark:bg-[#18181b] border-2 border-[#c7c4d7] dark:border-[#2d2d30] text-slate-700 dark:text-slate-200 font-semibold rounded-xl p-2 outline-none"
              >
                {AVAILABLE_COLORS.map(col => (
                  <option key={col.id} value={col.id}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-1 px-2 border-2 border-[#c7c4d7] dark:border-[#475569] rounded-xl text-xs font-black hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-2 bg-[#121c2a] hover:bg-black dark:bg-[#d97706] dark:hover:bg-[#b45309] text-white rounded-xl text-xs font-black chunky-button shadow-md cursor-pointer"
              >
                Save Option
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
