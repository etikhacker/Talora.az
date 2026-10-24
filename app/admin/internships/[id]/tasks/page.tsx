'use client';

import { PageHeading } from '@/components/layout/page-heading';

import React, { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/lib/i18n/language-context';
import { getInternshipById } from '@/lib/internships/service';
import {
  getAllTasksForInternship,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
} from '@/lib/tasks/service';
import { taskSchema, TaskFormData } from '@/lib/validations/task';
import { formatDate } from '@/lib/utils/date';
import {
  Internship,
  InternshipTask,
  TaskDifficulty,
  TaskSubmissionType,
  TaskStatus,
} from '@/types/database';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Link as LinkIcon,
  Github,
  Upload,
  Layers,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Archive,
  Loader2,
  X,
  Sparkles,
  ListTodo,
} from 'lucide-react';

export default function AdminInternshipTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const internshipId = resolvedParams.id;

  const { language } = useLanguage();
  const isAz = language === 'az';
  const router = useRouter();

  const [internship, setInternship] = useState<Internship | null>(null);
  const [tasks, setTasks] = useState<InternshipTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<number | 'all'>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<InternshipTask | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    instructions: '',
    week_number: 1,
    task_number: 1,
    difficulty: 'intermediate',
    submission_type: 'github',
    deadline: '',
    is_required: true,
    status: 'published',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [internshipData, taskList] = await Promise.all([
        getInternshipById(internshipId),
        getAllTasksForInternship(internshipId, true), // include drafts
      ]);
      setInternship(internshipData);
      setTasks(taskList);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [internshipId]);

  useEffect(() => {
    let active = true;
    const fetchAsync = async () => {
      try {
        const [internshipData, taskList] = await Promise.all([
          getInternshipById(internshipId),
          getAllTasksForInternship(internshipId, true),
        ]);
        if (active) {
          setInternship(internshipData);
          setTasks(taskList);
        }
      } catch (err) {
        console.error('Failed to load tasks:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAsync();
    return () => {
      active = false;
    };
  }, [internshipId]);

  // Open modal for new task
  const handleOpenCreate = () => {
    setEditingTask(null);
    const maxTaskNum = tasks.length > 0 ? Math.max(...tasks.map((t) => t.task_number)) + 1 : 1;
    const maxWeek = tasks.length > 0 ? Math.max(...tasks.map((t) => t.week_number)) : 1;
    setFormData({
      title: '',
      description: '',
      instructions: '',
      week_number: maxWeek || 1,
      task_number: maxTaskNum,
      difficulty: 'intermediate',
      submission_type: 'github',
      deadline: '',
      is_required: true,
      status: 'published',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (task: InternshipTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      instructions: task.instructions,
      week_number: task.week_number,
      task_number: task.task_number,
      difficulty: task.difficulty,
      submission_type: task.submission_type,
      deadline: task.deadline ? task.deadline.substring(0, 10) : '',
      is_required: task.is_required,
      status: task.status,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // Save task
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = taskSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (path) errors[String(path)] = issue.message;
      });
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      if (editingTask) {
        const res = await updateTask(editingTask.id, {
          title: formData.title,
          description: formData.description,
          instructions: formData.instructions,
          week_number: formData.week_number,
          task_number: formData.task_number,
          difficulty: formData.difficulty,
          submission_type: formData.submission_type,
          deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
          is_required: formData.is_required,
          status: formData.status,
        });
        if (res.success) {
          setModalOpen(false);
          await loadData();
        } else {
          setFormErrors({ general: res.error || 'Yenilənmə zamanı xəta baş verdi.' });
        }
      } else {
        const res = await createTask({
          internship_id: internshipId,
          title: formData.title,
          description: formData.description,
          instructions: formData.instructions,
          week_number: formData.week_number,
          task_number: formData.task_number,
          difficulty: formData.difficulty,
          submission_type: formData.submission_type,
          deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
          is_required: formData.is_required,
          status: formData.status,
        });
        if (res.success) {
          setModalOpen(false);
          await loadData();
        } else {
          setFormErrors({ general: res.error || 'Əlavə edilərkən xəta baş verdi.' });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xəta baş verdi.';
      setFormErrors({ general: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (task: InternshipTask) => {
    const nextStatus: TaskStatus = task.status === 'published' ? 'draft' : 'published';
    await updateTask(task.id, { status: nextStatus });
    await loadData();
  };

  // Archive task
  const handleArchive = async (task: InternshipTask) => {
    const confirm = window.confirm(
      isAz
        ? `"${task.title}" tapşırığını arxivləmək istəyirsiniz?`
        : `Archive task "${task.title}"?`
    );
    if (!confirm) return;
    await updateTask(task.id, { status: 'archived' });
    await loadData();
  };

  // Delete task
  const handleDelete = async (task: InternshipTask) => {
    const confirm = window.confirm(
      isAz
        ? `"${task.title}" tapşırığını tamamilə silmək istədiyinizə əminsiniz?`
        : `Are you sure you want to delete task "${task.title}"?`
    );
    if (!confirm) return;
    await deleteTask(task.id);
    await loadData();
  };

  // Move task up/down within list
  const handleMove = async (taskIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;
    if (targetIndex < 0 || targetIndex >= tasks.length) return;

    const currentTask = tasks[taskIndex];
    const targetTask = tasks[targetIndex];

    const updatedOrders = [
      { id: currentTask.id, week_number: targetTask.week_number, task_number: targetTask.task_number },
      { id: targetTask.id, week_number: currentTask.week_number, task_number: currentTask.task_number },
    ];

    await reorderTasks(internshipId, updatedOrders);
    await loadData();
  };

  // Group tasks by week
  const weeks = Array.from(new Set(tasks.map((t) => t.week_number))).sort((a, b) => a - b);
  const filteredTasks = tasks.filter((t) =>
    selectedWeekFilter === 'all' ? true : t.week_number === selectedWeekFilter
  );

  const getDifficultyBadge = (difficulty: TaskDifficulty) => {
    switch (difficulty) {
      case 'beginner':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {isAz ? 'Başlanğıc' : 'Beginner'}
          </span>
        );
      case 'intermediate':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {isAz ? 'Orta Səviyyə' : 'Intermediate'}
          </span>
        );
      case 'advanced':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
            {isAz ? 'İrəli Səviyyə' : 'Advanced'}
          </span>
        );
    }
  };

  const getSubmissionIcon = (type: TaskSubmissionType) => {
    switch (type) {
      case 'text':
        return <FileText className="w-3.5 h-3.5 text-sky-400" />;
      case 'link':
        return <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />;
      case 'github':
        return <Github className="w-3.5 h-3.5 text-purple-400" />;
      case 'file':
        return <Upload className="w-3.5 h-3.5 text-amber-400" />;
      case 'multiple':
        return <Layers className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  const getSubmissionLabel = (type: TaskSubmissionType) => {
    switch (type) {
      case 'text':
        return isAz ? 'Mətn cavabı' : 'Text answer';
      case 'link':
        return isAz ? 'Canlı Link (URL)' : 'Live URL';
      case 'github':
        return 'GitHub Repozitoriya';
      case 'file':
        return isAz ? 'Fayl yükləmə' : 'File upload';
      case 'multiple':
        return isAz ? 'Kompleks (Çoxsaylı)' : 'Multiple formats';
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {isAz ? 'Dərc olunub' : 'Published'}
          </span>
        );
      case 'draft':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {isAz ? 'Qaralama' : 'Draft'}
          </span>
        );
      case 'archived':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-800/40">
            {isAz ? 'Arxivlənib' : 'Archived'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/admin/internships"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {isAz ? 'Təcrübə proqramlarına qayıt' : 'Back to Internships'}
            </Link>
          </div>
          <PageHeading embedded title={<>
            <ListTodo className="w-6 h-6 text-amber-400" />
            <span>{internship?.title || (isAz ? 'Tapşırıqlar İdarəetməsi' : 'Task Management')}</span>
          </>} description={<>
            {isAz
              ? 'Tələbələrin icra edəcəyi həftəlik praktiki tapşırıqlar, meyarlar və təhvil formatları'
              : 'Weekly hands-on tasks, instructions and submission formats for enrolled students'}
          </>} />
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold gap-1.5 shadow-xs text-xs"
          >
            <Plus className="w-4 h-4" />
            {isAz ? 'Yeni Tapşırıq Əlavə Et' : 'Add New Task'}
          </Button>
        </div>
      </div>

      {/* Week Filter Tabs */}
      {weeks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <button
            onClick={() => setSelectedWeekFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedWeekFilter === 'all'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {isAz ? 'Bütün Həftələr' : 'All Weeks'} ({tasks.length})
          </button>
          {weeks.map((w) => {
            const count = tasks.filter((t) => t.week_number === w).length;
            return (
              <button
                key={w}
                onClick={() => setSelectedWeekFilter(w)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedWeekFilter === w
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {isAz ? `${w}-ci Həftə` : `Week ${w}`} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Task List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-400" />
          <p className="text-xs">{isAz ? 'Tapşırıqlar yüklənir...' : 'Loading tasks...'}</p>
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="space-y-3">
          {filteredTasks.map((task, idx) => (
            <Card
              key={task.id}
              className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all text-white overflow-hidden shadow-xs"
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                        {isAz ? `Həftə ${task.week_number} • Tapşırıq #${task.task_number}` : `Week ${task.week_number} • Task #${task.task_number}`}
                      </span>
                      {getStatusBadge(task.status)}
                      {getDifficultyBadge(task.difficulty)}
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700/60">
                        {getSubmissionIcon(task.submission_type)}
                        {getSubmissionLabel(task.submission_type)}
                      </span>
                      {task.is_required ? (
                        <span className="text-[10px] font-semibold text-rose-300 bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 rounded">
                          {isAz ? 'Məcburi' : 'Required'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          {isAz ? 'Seçimli' : 'Optional'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight">
                      {task.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>

                    {task.deadline && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {isAz ? 'Son təhvil tarixi:' : 'Deadline:'}{' '}
                          {formatDate(task.deadline)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800 shrink-0">
                    {/* Reorder Buttons */}
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                      <button
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                        title={isAz ? 'Yuxarı qaldır' : 'Move up'}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === filteredTasks.length - 1}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                        title={isAz ? 'Aşağı endir' : 'Move down'}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Publish / Unpublish Toggle */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(task)}
                      className={`h-8 text-xs gap-1 border-slate-700 ${
                        task.status === 'published'
                          ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                    >
                      {task.status === 'published' ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          {isAz ? 'Qaralama et' : 'Unpublish'}
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          {isAz ? 'Dərc et' : 'Publish'}
                        </>
                      )}
                    </Button>

                    {/* Edit */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(task)}
                      className="h-8 text-xs gap-1 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      {isAz ? 'Redaktə' : 'Edit'}
                    </Button>

                    {/* Archive */}
                    {task.status !== 'archived' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchive(task)}
                        className="h-8 text-xs gap-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 p-2"
                        title={isAz ? 'Arxivlə' : 'Archive'}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(task)}
                      className="h-8 text-xs gap-1 text-red-400 hover:text-red-300 hover:bg-red-950/40 p-2"
                      title={isAz ? 'Sil' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <ListTodo className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {isAz ? 'Tapşırıq tapılmadı' : 'No Tasks Found'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
              {isAz
                ? 'Bu təcrübə proqramı üçün hələlik heç bir praktiki tapşırıq əlavə edilməyib.'
                : 'No tasks have been added for this internship cohort yet.'}
            </p>
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-semibold gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {isAz ? 'İlk Tapşırığı Yarat' : 'Create First Task'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Task Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingTask
                      ? isAz
                        ? 'Tapşırığı Redaktə Et'
                        : 'Edit Task'
                      : isAz
                      ? 'Yeni Praktiki Tapşırıq Əlavə Et'
                      : 'Add New Task'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {internship?.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formErrors.general && (
              <div className="mt-4 p-3 bg-red-950/50 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{formErrors.general}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 mt-4">
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold text-slate-200">
                  {isAz ? 'Tapşırıq Başlığı *' : 'Task Title *'}
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={
                    isAz
                      ? 'Məs: Next.js App Router ilə REST API İnteqrasiyası'
                      : 'E.g. REST API Integration with Next.js'
                  }
                  className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                />
                {formErrors.title && (
                  <p className="text-[11px] text-red-400">{formErrors.title}</p>
                )}
              </div>

              {/* Week Number & Task Number */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="week_number" className="text-xs font-semibold text-slate-200">
                    {isAz ? 'Həftə Nömrəsi (Week) *' : 'Week Number *'}
                  </Label>
                  <Input
                    id="week_number"
                    type="number"
                    min={1}
                    max={52}
                    value={formData.week_number}
                    onChange={(e) =>
                      setFormData({ ...formData, week_number: parseInt(e.target.value) || 1 })
                    }
                    className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                  />
                  {formErrors.week_number && (
                    <p className="text-[11px] text-red-400">{formErrors.week_number}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="task_number" className="text-xs font-semibold text-slate-200">
                    {isAz ? 'Tapşırıq Nömrəsi *' : 'Task Number *'}
                  </Label>
                  <Input
                    id="task_number"
                    type="number"
                    min={1}
                    max={100}
                    value={formData.task_number}
                    onChange={(e) =>
                      setFormData({ ...formData, task_number: parseInt(e.target.value) || 1 })
                    }
                    className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                  />
                  {formErrors.task_number && (
                    <p className="text-[11px] text-red-400">{formErrors.task_number}</p>
                  )}
                </div>
              </div>

              {/* Difficulty & Submission Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="difficulty" className="text-xs font-semibold text-slate-200">
                    {isAz ? 'Çətinlik Səviyyəsi *' : 'Difficulty *'}
                  </Label>
                  <select
                    id="difficulty"
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData({ ...formData, difficulty: e.target.value as TaskDifficulty })
                    }
                    className="w-full h-9 rounded-md bg-slate-950 border border-slate-800 text-white text-xs px-3 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="beginner">{isAz ? 'Başlanğıc (Beginner)' : 'Beginner'}</option>
                    <option value="intermediate">{isAz ? 'Orta (Intermediate)' : 'Intermediate'}</option>
                    <option value="advanced">{isAz ? 'İrəli (Advanced)' : 'Advanced'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="submission_type" className="text-xs font-semibold text-slate-200">
                    {isAz ? 'Təhvil Formatı *' : 'Submission Type *'}
                  </Label>
                  <select
                    id="submission_type"
                    value={formData.submission_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        submission_type: e.target.value as TaskSubmissionType,
                      })
                    }
                    className="w-full h-9 rounded-md bg-slate-950 border border-slate-800 text-white text-xs px-3 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="github">GitHub Repozitoriya</option>
                    <option value="link">{isAz ? 'Canlı Link / URL' : 'Live URL'}</option>
                    <option value="file">{isAz ? 'Fayl yükləmə (Storage)' : 'File upload'}</option>
                    <option value="text">{isAz ? 'Mətn cavabı' : 'Text Answer'}</option>
                    <option value="multiple">{isAz ? 'Kompleks (Çoxsaylı format)' : 'Multiple formats'}</option>
                  </select>
                </div>
              </div>

              {/* Deadline & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="deadline" className="text-xs font-semibold text-slate-200">
                    {isAz ? 'Son Təhvil Tarixi (Deadline)' : 'Deadline'}
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline || ''}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-xs font-semibold text-slate-200">
                    {isAz ? 'Status *' : 'Status *'}
                  </Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as TaskStatus })
                    }
                    className="w-full h-9 rounded-md bg-slate-950 border border-slate-800 text-white text-xs px-3 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="published">{isAz ? 'Dərc olunub (Published)' : 'Published'}</option>
                    <option value="draft">{isAz ? 'Qaralama (Draft)' : 'Draft'}</option>
                    <option value="archived">{isAz ? 'Arxiv (Archived)' : 'Archived'}</option>
                  </select>
                </div>
              </div>

              {/* Is Required Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="is_required"
                  type="checkbox"
                  checked={formData.is_required}
                  onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-amber-400 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                />
                <Label htmlFor="is_required" className="text-xs font-medium text-slate-300 cursor-pointer">
                  {isAz
                    ? 'Bu tapşırıq təcrübənin tamamlanması və sertifikat üçün məcburidir'
                    : 'This task is required for internship completion'}
                </Label>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-semibold text-slate-200">
                  {isAz ? 'Qısa Təsvir *' : 'Short Description *'}
                </Label>
                <textarea
                  id="description"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={
                    isAz
                      ? 'Tapşırığın məqsədi və qısa xülasəsi...'
                      : 'Brief overview and goal of the task...'
                  }
                  className="w-full rounded-md bg-slate-950 border border-slate-800 text-white text-xs p-3 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                {formErrors.description && (
                  <p className="text-[11px] text-red-400">{formErrors.description}</p>
                )}
              </div>

              {/* Instructions */}
              <div className="space-y-1.5">
                <Label htmlFor="instructions" className="text-xs font-semibold text-slate-200">
                  {isAz ? 'Ətraflı İcra Təlimatları (Addım-ba-addım) *' : 'Detailed Instructions *'}
                </Label>
                <textarea
                  id="instructions"
                  rows={14}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder={
                    isAz
                      ? '1. Repozitoriyanı klonlayın...\n2. Konfiqurasiyanı qurun...\n3. Testləri icra edin...'
                      : 'Step-by-step guidelines for the student...'
                  }
                  className="w-full rounded-md bg-slate-950 border border-slate-800 text-white text-xs p-3 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
                />
                {formErrors.instructions && (
                  <p className="text-[11px] text-red-400">{formErrors.instructions}</p>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs"
                >
                  {isAz ? 'Ləğv et' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingTask
                    ? isAz
                      ? 'Yadda Saxla'
                      : 'Save Changes'
                    : isAz
                    ? 'Tapşırığı Əlavə Et'
                    : 'Create Task'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
