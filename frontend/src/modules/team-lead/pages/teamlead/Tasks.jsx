
import React, {
  useState,
  useMemo,
  useRef,
  useEffect
} from 'react';

import { useTeamLead } from '../../context/TeamLeadContext.jsx';
import { Avatar } from '../../components/common/Avatar.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { ModalPortal } from '../../components/common/ModalPortal.jsx';
import { formatDate } from '../../utils/helpers.js';

import {
  canAssignTasks,
  canAccessProject,
  getScopedTasks,
  getScopedTeamMembers,
  getUserRole,
  userIdOf
} from '../../utils/dataScope.js';

import {
  Plus,
  Search,
  Calendar,
  MessageSquare,
  Paperclip,
  Trash2,
  Edit3,
  Eye,
  LayoutGrid,
  List,
  X,
  Loader2,
  AlertCircle,
  FolderKanban,
  Send
} from 'lucide-react';


// ============================================================
// CONFIGURATION
// ============================================================

const TASK_STATUSES = [
  'To Do',
  'In Progress',
  'In Review',
  'Completed'
];

const TASK_PRIORITIES = [
  'Critical',
  'High',
  'Medium',
  'Low'
];

const MAX_COMMENT_LENGTH = 500;

const PRIORITY_COLORS = {
  Low: 'text-muted bg-surface2 border-line',
  Medium: 'text-info bg-info/10 border-info/30',
  High: 'text-warn bg-warn/10 border-warn/30',
  Critical: 'text-bad bg-bad/10 border-bad/30 font-bold'
};

const INPUT_CLASS =
  'w-full bg-surface2 border border-line rounded-xl px-3 py-2 text-xs text-ink placeholder:text-muted focus:border-accent';

const SELECT_CLASS =
  'w-full bg-[#141824] border border-line rounded-xl px-3 py-2 text-xs text-white focus:border-accent';

const BUTTON_CLASS =
  'rounded-xl px-3.5 py-2 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';


// ============================================================
// HELPERS
// ============================================================

const safeArray = value =>
  Array.isArray(value) ? value : [];

const normalize = value =>
  String(value ?? '').trim().toLowerCase();

const sameId = (first, second) =>
  Boolean(normalize(first)) &&
  normalize(first) === normalize(second);

const getMemberId = member =>
  String(
    member?.id ||
    member?.employeeId ||
    member?.userId ||
    ''
  );

const getIdentityIds = user =>
  [
    user?.id,
    user?.employeeId,
    user?.userId,
    userIdOf(user)
  ].map(normalize).filter(Boolean);

const getToday = () => {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
};

const normalizeDate = value => {
  const text = String(value || '').slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return '';
  }

  const date = new Date(`${text}T00:00:00Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== text
  ) {
    return '';
  }

  return text;
};

const displayDate = value =>
  normalizeDate(value)
    ? formatDate(normalizeDate(value))
    : 'Not assigned';

const getTaskStatus = task => {
  const status = normalize(task?.status);

  if (['completed', 'done'].includes(status)) {
    return 'Completed';
  }

  if (status === 'in progress') {
    return 'In Progress';
  }

  if (status === 'in review') {
    return 'In Review';
  }

  if (['to do', 'todo', 'pending', ''].includes(status)) {
    return 'To Do';
  }

  return String(task?.status);
};

const isCompleted = task =>
  getTaskStatus(task) === 'Completed';

const isOverdue = (task, today) => {
  const dueDate = normalizeDate(task?.dueDate);

  return Boolean(
    dueDate &&
    !isCompleted(task) &&
    dueDate < today
  );
};

const getProgress = task => {
  if (isCompleted(task)) return 100;

  if (getTaskStatus(task) === 'To Do') {
    return 0;
  }

  const progress = Number(task?.progress);

  return Number.isFinite(progress)
    ? Math.min(99, Math.max(0, progress))
    : 0;
};

const initialForm = () => ({
  title: '',
  description: '',
  category: 'General',
  priority: 'Medium',
  status: 'To Do',
  assigneeId: '',
  projectId: '',
  startDate: getToday(),
  dueDate: '',
  progress: 0
});


// ============================================================
// REUSABLE COMPONENTS
// ============================================================

const PriorityBadge = ({ priority }) => (
  <span
    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
      PRIORITY_COLORS[priority] ||
      PRIORITY_COLORS.Medium
    }`}
  >
    {priority || 'Medium'}
  </span>
);

const TaskProgress = ({ task, overdue }) => {
  const progress = getProgress(task);

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted">Progress</span>

        <span className="font-data font-bold text-ink">
          {progress}%
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full border border-line bg-surface">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            progress === 100
              ? 'bg-good'
              : overdue
                ? 'bg-bad'
                : 'bg-accent'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

const ErrorMessage = ({ message }) =>
  message ? (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-bad/30 bg-bad/10 p-3 text-xs text-bad"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  ) : null;


// ============================================================
// MAIN TASK MANAGEMENT COMPONENT
// ============================================================

export const Tasks = () => {

  const {
    tasks = [],
    teamMembers = [],
    projects = [],
    currentUser,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    addTaskComment,
    globalSearchTerm = '',
    triggerToast
  } = useTeamLead();

  const canManage = canAssignTasks(currentUser);

  const actorIds = getIdentityIds(currentUser);

  const identityKey = [
    ...actorIds,
    getUserRole(currentUser)
  ].join('|');


// ============================================================
// STATE
// ============================================================

  const [today, setToday] = useState(getToday);

  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [taskToDeleteId, setTaskToDeleteId] = useState(null);

  const [taskForm, setTaskForm] = useState(initialForm);
  const [newCommentText, setNewCommentText] = useState('');
  const [progressDraft, setProgressDraft] = useState('');

  const [busyAction, setBusyAction] = useState('');
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');
  const [commentError, setCommentError] = useState('');

  const busyRef = useRef(false);

  const isBusy = Boolean(busyAction);


// ============================================================
// DATE AND USER SYNCHRONIZATION
// ============================================================

  useEffect(() => {
    const timer = window.setInterval(
      () => setToday(getToday()),
      60000
    );

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsFormOpen(false);
    setEditingTaskId(null);
    setDetailTaskId(null);
    setTaskToDeleteId(null);
    setTaskForm(initialForm());
    setNewCommentText('');
    setProgressDraft('');
    setFormError('');
    setActionError('');
    setCommentError('');

    setStatusFilter('All');
    setPriorityFilter('All');
    setAssigneeFilter('All');
    setProjectFilter('All');

  }, [identityKey]);


// ============================================================
// AUTHORIZED DATA
// ============================================================

  const authorizedMembers = useMemo(
    () => getScopedTeamMembers(
      currentUser,
      safeArray(teamMembers)
    ),
    [currentUser, teamMembers]
  );

  const authorizedTasks = useMemo(
    () => getScopedTasks(
      currentUser,
      safeArray(tasks),
      authorizedMembers
    ),
    [currentUser, tasks, authorizedMembers]
  );

  const authorizedProjects = useMemo(
    () => safeArray(projects).filter(project =>
      canAccessProject(
        currentUser,
        project,
        authorizedMembers
      )
    ),
    [currentUser, projects, authorizedMembers]
  );

  const findProject = projectId =>
    authorizedProjects.find(project =>
      sameId(project.id, projectId)
    );

  const findTask = taskId =>
    authorizedTasks.find(task =>
      sameId(task.id, taskId)
    );

  const detailTask =
    findTask(detailTaskId) || null;

  const taskToDelete =
    findTask(taskToDeleteId) || null;

  const editingTask =
    findTask(editingTaskId) || null;

  const selectedFormProject =
    findProject(taskForm.projectId);

  const projectLocked = task =>
    Boolean(
      task?.projectId &&
      findProject(task.projectId)?.status === 'Completed'
    );

  const canModifyTask = task => {
    if (!task || !findTask(task.id)) {
      return false;
    }

    if (projectLocked(task)) {
      return false;
    }

    if (canManage) {
      return true;
    }

    return actorIds.includes(
      normalize(task.assigneeId)
    );
  };


// ============================================================
// AVAILABLE ASSIGNEES
// ============================================================

  const availableMembers = useMemo(() => {

    const members = authorizedMembers.filter(
      member => Boolean(getMemberId(member))
    );

    if (
      currentUser &&
      userIdOf(currentUser) &&
      !members.some(member =>
        sameId(
          getMemberId(member),
          userIdOf(currentUser)
        )
      )
    ) {
      members.push({
        ...currentUser,
        id: userIdOf(currentUser)
      });
    }

    return members;

  }, [authorizedMembers, currentUser]);

  const formMembers = selectedFormProject
    ? availableMembers.filter(member => {
        const memberId = getMemberId(member);

        return (
          safeArray(selectedFormProject.memberIds)
            .some(id => sameId(id, memberId)) ||
          sameId(
            selectedFormProject.ownerId,
            memberId
          ) ||
          sameId(
            selectedFormProject.teamLeadId,
            memberId
          )
        );
      })
    : availableMembers;

  const categories = [
    ...new Set([
      'General',
      'Project',
      ...authorizedTasks
        .map(task => task.category)
        .filter(Boolean)
    ])
  ];


// ============================================================
// KPI CALCULATIONS
// ============================================================

  const totalTasks = authorizedTasks.length;

  const inProgress = authorizedTasks.filter(
    task => getTaskStatus(task) === 'In Progress'
  ).length;

  const inReview = authorizedTasks.filter(
    task => getTaskStatus(task) === 'In Review'
  ).length;

  const completed = authorizedTasks.filter(
    isCompleted
  ).length;

  const overdue = authorizedTasks.filter(
    task => isOverdue(task, today)
  ).length;

  const kpis = [
    {
      label: 'All Tasks',
      filter: 'All',
      value: totalTasks,
      tone: 'text-ink',
      labelTone: 'text-muted',
      border: 'border-accent'
    },
    {
      label: 'In Progress',
      filter: 'In Progress',
      value: inProgress,
      tone: 'text-info',
      labelTone: 'text-info',
      border: 'border-info'
    },
    {
      label: 'In Review',
      filter: 'In Review',
      value: inReview,
      tone: 'text-accent2',
      labelTone: 'text-accent2',
      border: 'border-accent2'
    },
    {
      label: 'Completed',
      filter: 'Completed',
      value: completed,
      tone: 'text-good',
      labelTone: 'text-good',
      border: 'border-good'
    },
    {
      label: 'Overdue',
      filter: 'Overdue',
      value: overdue,
      tone: 'text-bad',
      labelTone: 'text-bad',
      border: 'border-bad'
    }
  ];


// ============================================================
// SEARCH AND FILTERS
// ============================================================

  const effectiveSearch = normalize(
    searchTerm || globalSearchTerm
  );

  const filteredTasks = useMemo(() => {

    return authorizedTasks.filter(task => {

      const project = authorizedProjects.find(
        item => sameId(item.id, task.projectId)
      );

      const searchText = normalize([
        task.id,
        task.title,
        task.description,
        task.assigneeName,
        task.assigneeId,
        task.category,
        project?.name,
        project?.projectCode
      ].filter(Boolean).join(' '));

      const matchSearch =
        searchText.includes(effectiveSearch);

      const matchStatus =
        statusFilter === 'All' ||
        (
          statusFilter === 'Overdue'
            ? isOverdue(task, today)
            : getTaskStatus(task) === statusFilter
        );

      const matchPriority =
        priorityFilter === 'All' ||
        normalize(task.priority) ===
          normalize(priorityFilter);

      const matchAssignee =
        assigneeFilter === 'All' ||
        sameId(task.assigneeId, assigneeFilter);

      const matchProject =
        projectFilter === 'All' ||
        (
          projectFilter === 'Unassigned'
            ? !task.projectId
            : sameId(task.projectId, projectFilter)
        );

      return (
        matchSearch &&
        matchStatus &&
        matchPriority &&
        matchAssignee &&
        matchProject
      );

    });

  }, [
    authorizedTasks,
    authorizedProjects,
    effectiveSearch,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    projectFilter,
    today
  ]);

  const boardStatuses = [
    ...new Set([
      ...TASK_STATUSES,
      ...authorizedTasks.map(getTaskStatus)
    ])
  ];

  const activeSprintNames = [
    ...new Set(
      authorizedProjects
        .map(project => project.activeSprint?.name)
        .filter(Boolean)
    )
  ];

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setAssigneeFilter('All');
    setProjectFilter('All');
  };


// ============================================================
// ASYNC ACTION HANDLING
// ============================================================

  const beginAction = action => {
    if (busyRef.current) return false;

    busyRef.current = true;
    setBusyAction(action);

    return true;
  };

  const finishAction = () => {
    busyRef.current = false;
    setBusyAction('');
  };

  const reportError = (error, fallback) => {
    const message =
      error?.message || fallback;

    triggerToast?.(message, 'error');

    return message;
  };

  const assertResult = (result, message) => {
    if (
      result === false ||
      result?.success === false
    ) {
      throw new Error(
        result?.message || message
      );
    }

    return result;
  };


// ============================================================
// OPEN CREATE TASK
// ============================================================

  const openCreateTask = () => {
    if (!canManage || busyRef.current) {
      return;
    }

    setEditingTaskId(null);
    setDetailTaskId(null);
    setTaskForm(initialForm());
    setFormError('');
    setIsFormOpen(true);
  };


// ============================================================
// OPEN EDIT TASK
// ============================================================

  const openEditTask = task => {
    if (
      !canManage ||
      !canModifyTask(task) ||
      busyRef.current
    ) {
      return;
    }

    setEditingTaskId(task.id);

    setTaskForm({
      title: task.title || '',
      description: task.description || '',
      category: task.category || 'General',
      priority: task.priority || 'Medium',
      status: getTaskStatus(task),
      assigneeId: String(task.assigneeId || ''),
      projectId: String(task.projectId || ''),
      startDate: normalizeDate(task.startDate) || getToday(),
      dueDate: normalizeDate(task.dueDate),
      progress: getProgress(task)
    });

    setDetailTaskId(null);
    setFormError('');
    setIsFormOpen(true);
  };

  const closeTaskForm = () => {
    if (busyRef.current) return;

    setIsFormOpen(false);
    setEditingTaskId(null);
    setTaskForm(initialForm());
    setFormError('');
  };


// ============================================================
// FORM FIELD UPDATES
// ============================================================

  const updateFormField = (field, value) => {

    setTaskForm(previous => {

      const next = {
        ...previous,
        [field]: value
      };

      if (field === 'status') {

        if (value === 'Completed') {
          next.progress = 100;
        } else if (value === 'To Do') {
          next.progress = 0;
        } else {
          next.progress = Math.min(
            99,
            Number(previous.progress) || 0
          );
        }
      }

      if (field === 'projectId') {

        const project = findProject(value);

        if (project) {

          next.category = 'Project';

          if (
            project.startDate &&
            next.startDate < project.startDate
          ) {
            next.startDate = project.startDate;
          }

          if (
            project.dueDate &&
            next.dueDate > project.dueDate
          ) {
            next.dueDate = project.dueDate;
          }

          const validAssignee =
            safeArray(project.memberIds).some(
              id => sameId(id, next.assigneeId)
            ) ||
            sameId(project.ownerId, next.assigneeId) ||
            sameId(project.teamLeadId, next.assigneeId);

          if (!validAssignee) {
            next.assigneeId = '';
          }

        } else if (next.category === 'Project') {

          next.category = 'General';
        }
      }

      return next;
    });

    setFormError('');
  };


// ============================================================
// TASK VALIDATION
// ============================================================

  const validateTask = () => {

    if (!canManage) {
      return 'Task management permission is required.';
    }

    if (
      editingTaskId &&
      (!editingTask || !canModifyTask(editingTask))
    ) {
      return 'This task cannot be edited.';
    }

    if (
      !taskForm.title.trim() ||
      taskForm.title.trim().length > 150
    ) {
      return 'Enter a task title of up to 150 characters.';
    }

    if (taskForm.description.length > 1000) {
      return 'Description cannot exceed 1000 characters.';
    }

    if (!taskForm.category.trim()) {
      return 'Select a task category.';
    }

    if (!TASK_PRIORITIES.includes(taskForm.priority)) {
      return 'Select a valid task priority.';
    }

    if (!TASK_STATUSES.includes(taskForm.status)) {
      return 'Select a valid task status.';
    }

    const startDate = normalizeDate(taskForm.startDate);
    const dueDate = normalizeDate(taskForm.dueDate);

    if (!startDate || !dueDate) {
      return 'Enter valid start and due dates.';
    }

    if (dueDate < startDate) {
      return 'Due date must be on or after the start date.';
    }

    const assignee = formMembers.find(member =>
      sameId(
        getMemberId(member),
        taskForm.assigneeId
      )
    );

    if (!assignee) {
      return 'Select an authorized task assignee.';
    }

    if (
      taskForm.category === 'Project' &&
      !taskForm.projectId
    ) {
      return 'Select a project for this project task.';
    }

    if (taskForm.projectId) {

      if (!selectedFormProject) {
        return 'The selected project is unavailable.';
      }

      if (selectedFormProject.status === 'Completed') {
        return 'Completed projects cannot receive new or modified tasks.';
      }

      if (
        selectedFormProject.startDate &&
        startDate < selectedFormProject.startDate
      ) {
        return 'Task cannot start before the project start date.';
      }

      if (
        selectedFormProject.dueDate &&
        dueDate > selectedFormProject.dueDate
      ) {
        return 'Task due date cannot exceed the project deadline.';
      }
    }

    const numericProgress = Number(taskForm.progress);

    if (
      taskForm.progress === '' ||
      !Number.isFinite(numericProgress) ||
      numericProgress < 0 ||
      numericProgress > 100
    ) {
      return 'Progress must be between 0 and 100.';
    }

    if (
      taskForm.status !== 'Completed' &&
      numericProgress === 100
    ) {
      return 'Select Completed status to set progress to 100%.';
    }

    return '';
  };


// ============================================================
// CREATE AND UPDATE TASK
// ============================================================

  const handleSaveTask = async event => {

    event.preventDefault();

    setFormError('');

    const validationError = validateTask();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (!beginAction('save-task')) return;

    try {

      const assignee = formMembers.find(member =>
        sameId(
          getMemberId(member),
          taskForm.assigneeId
        )
      );

      const payload = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        category: taskForm.category,
        priority: taskForm.priority,
        status: taskForm.status,
        assigneeId: getMemberId(assignee),
        assigneeName: assignee.name,
        projectId: taskForm.projectId || null,
        startDate: normalizeDate(taskForm.startDate),
        dueDate: normalizeDate(taskForm.dueDate),

        progress:
          taskForm.status === 'Completed'
            ? 100
            : taskForm.status === 'To Do'
              ? 0
              : Math.min(99, Number(taskForm.progress))
      };

      let savedTask;

      if (editingTaskId) {

        if (typeof updateTask !== 'function') {
          throw new Error(
            'Unable to update task at this time.'
          );
        }

        savedTask = await updateTask(
          editingTaskId,
          payload
        );

        if (!sameId(savedTask?.id, editingTaskId)) {
          throw new Error(
            'Existing task update could not be confirmed.'
          );
        }

      } else {

        savedTask = await createTask({
          ...payload,
          attachments: 0,
          comments: []
        });

        if (!savedTask?.id) {
          throw new Error(
            'Task creation could not be confirmed.'
          );
        }
      }

      triggerToast?.(
        editingTaskId
          ? 'Task updated successfully.'
          : 'Task created successfully.',
        'good'
      );

      setIsFormOpen(false);
      setEditingTaskId(null);
      setTaskForm(initialForm());

    } catch (error) {

      setFormError(
        reportError(
          error,
          'Unable to save task.'
        )
      );

    } finally {

      finishAction();
    }
  };


// ============================================================
// TASK STATUS UPDATE
// ============================================================

  const handleStatusChange = async (taskId, status) => {

    const task = findTask(taskId);

    if (
      !canModifyTask(task) ||
      !TASK_STATUSES.includes(status)
    ) {
      return;
    }

    if (
      getTaskStatus(task) === status ||
      !beginAction(`status-${taskId}`)
    ) {
      return;
    }

    setActionError('');

    try {

      const result = await updateTaskStatus(
        taskId,
        status
      );

      assertResult(
        result,
        'Unable to update task status.'
      );

      setProgressDraft('');

    } catch (error) {

      setActionError(
        reportError(
          error,
          'Task status update failed.'
        )
      );

    } finally {

      finishAction();
    }
  };


// ============================================================
// MANUAL PROGRESS UPDATE
// ============================================================

  const handleProgressUpdate = async event => {

    event.preventDefault();

    if (!canModifyTask(detailTask)) return;

    const progress = Number(progressDraft);

    if (
      progressDraft === '' ||
      !Number.isFinite(progress) ||
      progress < 0 ||
      progress > 99
    ) {
      setActionError(
        'Enter progress between 0 and 99. Use Completed status for 100%.'
      );
      return;
    }

    if (
      isCompleted(detailTask) ||
      getTaskStatus(detailTask) === 'To Do'
    ) {
      setActionError(
        'Select In Progress or In Review before updating progress.'
      );
      return;
    }

    if (!beginAction('progress')) return;

    setActionError('');

    try {

      if (typeof updateTask !== 'function') {
        throw new Error(
          'Unable to update task at this time.'
        );
      }

      const result = await updateTask(
        detailTask.id,
        { progress }
      );

      if (!sameId(result?.id, detailTask.id)) {
        throw new Error(
          'Progress update could not be confirmed.'
        );
      }

      setProgressDraft('');

      triggerToast?.(
        'Task progress updated.',
        'good'
      );

    } catch (error) {

      setActionError(
        reportError(
          error,
          'Unable to update progress.'
        )
      );

    } finally {

      finishAction();
    }
  };


// ============================================================
// TASK DETAILS
// ============================================================

  const openTaskDetails = task => {

    if (!findTask(task.id) || busyRef.current) {
      return;
    }

    setDetailTaskId(task.id);
    setNewCommentText('');
    setProgressDraft('');
    setActionError('');
    setCommentError('');
  };

  const closeTaskDetails = () => {
    if (busyRef.current) return;

    setDetailTaskId(null);
    setNewCommentText('');
    setProgressDraft('');
    setActionError('');
    setCommentError('');
  };


// ============================================================
// TASK COMMENTS
// ============================================================

  const handleCommentSubmit = async event => {

    event.preventDefault();

    if (!detailTask) return;

    const message = newCommentText.trim();

    setCommentError('');

    if (
      !message ||
      message.length > MAX_COMMENT_LENGTH
    ) {
      setCommentError(
        `Enter a comment of up to ${MAX_COMMENT_LENGTH} characters.`
      );
      return;
    }

    if (!beginAction('comment')) return;

    try {

      const result = await addTaskComment(
        detailTask.id,
        message
      );

      assertResult(
        result,
        'Unable to post task comment.'
      );

      setNewCommentText('');

    } catch (error) {

      setCommentError(
        reportError(
          error,
          'Unable to post comment.'
        )
      );

    } finally {

      finishAction();
    }
  };


// ============================================================
// DELETE TASK
// ============================================================

  const openDeleteTask = task => {

    if (
      !canManage ||
      !canModifyTask(task) ||
      busyRef.current
    ) {
      return;
    }

    setDetailTaskId(null);
    setTaskToDeleteId(task.id);
    setActionError('');
  };

  const closeDeleteTask = () => {
    if (busyRef.current) return;

    setTaskToDeleteId(null);
    setActionError('');
  };

  const handleDeleteTask = async () => {

    if (
      !taskToDelete ||
      !canManage ||
      !canModifyTask(taskToDelete)
    ) {
      return;
    }

    if (!beginAction('delete')) return;

    setActionError('');

    try {

      const result = await deleteTask(
        taskToDelete.id
      );

      assertResult(
        result,
        'Task deletion failed.'
      );

      setTaskToDeleteId(null);

    } catch (error) {

      setActionError(
        reportError(
          error,
          'Unable to delete task.'
        )
      );

    } finally {

      finishAction();
    }
  };


// ============================================================
// STATUS SELECT
// ============================================================

  const renderStatusSelect = task => {

    const status = getTaskStatus(task);

    return (
      <select
        aria-label={`Status for ${task.title}`}
        value={status}
        disabled={
          isBusy ||
          !canModifyTask(task)
        }
        onChange={event =>
          handleStatusChange(
            task.id,
            event.target.value
          )
        }
        className="rounded-xl border border-line bg-surface2 px-2.5 py-1.5 text-xs text-ink focus:border-accent disabled:opacity-50"
      >

        {!TASK_STATUSES.includes(status) && (
          <option value={status} disabled>
            {status}
          </option>
        )}

        {TASK_STATUSES.map(item => (
          <option
            key={item}
            value={item}
            className="bg-[#06141c]"
          >
            {item}
          </option>
        ))}

      </select>
    );
  };


// ============================================================
// MAIN UI
// ============================================================

  return (

    <div className="space-y-5">

      {/* KPI CARDS */}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">

        {kpis.map(kpi => (

          <button
            key={kpi.filter}
            type="button"
            aria-pressed={statusFilter === kpi.filter}
            onClick={() => setStatusFilter(kpi.filter)}
            className={`glass-card kpi-card !h-[140px] !p-5 flex flex-col justify-between text-left cursor-pointer transition ${
              statusFilter === kpi.filter
                ? kpi.border
                : ''
            }`}
          >

            <span className={`text-xs font-medium uppercase tracking-wider ${kpi.labelTone}`}>
              {kpi.label}
            </span>

            <div className={`mt-1 font-data text-[34px] font-bold ${kpi.tone}`}>
              {kpi.value}
            </div>

          </button>

        ))}

      </div>


      {/* SEARCH AND FILTERS */}

      <section className="glass-card !p-3">

        <div className="flex w-full flex-wrap items-center justify-between gap-3">

          <div className="relative min-w-[200px] flex-1">

            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />

            <input
              type="search"
              placeholder="Search tasks, descriptions, assignees..."
              value={searchTerm}
              onChange={event =>
                setSearchTerm(event.target.value)
              }
              className="w-full rounded-xl border border-line bg-surface2 py-2 pl-8 pr-3 text-xs text-ink placeholder:text-muted focus:border-accent"
            />

          </div>

          <div className="flex flex-wrap items-center gap-2">

            <select
              aria-label="Filter task status"
              value={statusFilter}
              onChange={event =>
                setStatusFilter(event.target.value)
              }
              className={SELECT_CLASS + ' !w-auto'}
            >
              <option value="All">All Statuses</option>

              {boardStatuses.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}

              <option value="Overdue">Overdue</option>
            </select>

            <select
              aria-label="Filter priority"
              value={priorityFilter}
              onChange={event =>
                setPriorityFilter(event.target.value)
              }
              className={SELECT_CLASS + ' !w-auto'}
            >
              <option value="All">All Priorities</option>

              {TASK_PRIORITIES.map(priority => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter assignee"
              value={assigneeFilter}
              onChange={event =>
                setAssigneeFilter(event.target.value)
              }
              className={SELECT_CLASS + ' !w-auto'}
            >
              <option value="All">All Engineers</option>

              {availableMembers.map(member => (
                <option
                  key={getMemberId(member)}
                  value={getMemberId(member)}
                >
                  {member.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter project"
              value={projectFilter}
              onChange={event =>
                setProjectFilter(event.target.value)
              }
              className={SELECT_CLASS + ' !w-auto max-w-[220px]'}
            >
              <option value="All">All Projects</option>
              <option value="Unassigned">No Project</option>

              {authorizedProjects.map(project => (
                <option
                  key={project.id}
                  value={project.id}
                >
                  {project.name}
                </option>
              ))}
            </select>

          </div>

          <div className="flex flex-wrap items-center gap-2">

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg px-2 py-1 text-xs text-muted hover:text-accent"
            >
              Clear Filters
            </button>

            <div className="flex items-center gap-1 rounded-xl border border-line bg-surface2 p-1">

              <button
                type="button"
                title="List View"
                aria-label="List View"
                aria-pressed={viewMode === 'list'}
                onClick={() => setViewMode('list')}
                className={`rounded-lg p-1.5 transition ${
                  viewMode === 'list'
                    ? 'bg-accent text-on-accent'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <List className="h-4 w-4" />
              </button>

              <button
                type="button"
                title="Kanban Board View"
                aria-label="Kanban Board View"
                aria-pressed={viewMode === 'board'}
                onClick={() => setViewMode('board')}
                className={`rounded-lg p-1.5 transition ${
                  viewMode === 'board'
                    ? 'bg-accent text-on-accent'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>

            </div>

            {canManage && (

              <button
                type="button"
                disabled={isBusy}
                onClick={openCreateTask}
                className={`${BUTTON_CLASS} flex items-center gap-1.5 bg-accent text-on-accent shadow-sm hover:brightness-105`}
              >
                <Plus className="h-4 w-4" />
                Create Task
              </button>

            )}

          </div>

        </div>

      </section>

      {!detailTask && !taskToDelete && (
        <ErrorMessage message={actionError} />
      )}


      {/* LIST VIEW */}

      {viewMode === 'list' && (

        <section className="glass-card !p-4 space-y-3">

          <div className="flex w-full flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-2">

            <h3 className="font-display text-sm font-semibold text-ink sm:text-base">
              Team Deliverables ({filteredTasks.length} Tasks)
            </h3>

            <span className="text-xs text-muted">
              {activeSprintNames.length === 1
                ? activeSprintNames[0]
                : activeSprintNames.length > 1
                  ? `${activeSprintNames.length} active sprint records`
                  : 'All Deliverables'}
            </span>

          </div>

          {!filteredTasks.length ? (

            <div className="p-12 text-center text-xs text-muted">
              No tasks found matching your filter criteria.
            </div>

          ) : (

            <div className="w-full space-y-3">

              {filteredTasks.map(task => {

                const overdueTask = isOverdue(task, today);
                const project = findProject(task.projectId);

                return (

                  <div
                    key={task.id}
                    className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-line/50 bg-surface2/50 p-3.5 transition hover:border-accent/40 md:flex-row md:items-center"
                  >

                    <div className="min-w-0 flex-1 space-y-1.5">

                      <div className="flex flex-wrap items-center gap-2">

                        <PriorityBadge priority={task.priority} />

                        <span className="rounded border border-accent/20 bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                          {task.category || 'General'}
                        </span>

                        <StatusBadge status={getTaskStatus(task)} />

                        {overdueTask && (
                          <span className="rounded-full border border-bad/30 bg-bad/15 px-2 py-0.5 text-[10px] font-bold text-bad">
                            Overdue
                          </span>
                        )}

                      </div>

                      <h4 className="text-sm font-semibold leading-snug text-ink">
                        {task.title}
                      </h4>

                      <p className="line-clamp-2 text-xs leading-relaxed text-muted">
                        {task.description || 'No description provided.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted">

                        <span className="flex items-center gap-1 font-medium text-ink">
                          <Avatar
                            name={task.assigneeName || 'Team Member'}
                            size="sm"
                          />
                          {task.assigneeName || 'Not assigned'}
                        </span>

                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Due: {displayDate(task.dueDate)}
                        </span>

                        {project && (

                          <span className="flex items-center gap-1 text-accent">
                            <FolderKanban className="h-3.5 w-3.5" />
                            {project.projectCode || project.name}
                          </span>

                        )}

                        {safeArray(task.comments).length > 0 && (

                          <span className="flex items-center gap-1 text-accent">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {safeArray(task.comments).length}
                          </span>

                        )}

                        {Number(task.attachments) > 0 && (

                          <span className="flex items-center gap-1">
                            <Paperclip className="h-3.5 w-3.5" />
                            {task.attachments}
                          </span>

                        )}

                      </div>

                      <div className="w-full max-w-md pt-1">
                        <TaskProgress
                          task={task}
                          overdue={overdueTask}
                        />
                      </div>

                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 self-end md:self-center">

                      {renderStatusSelect(task)}

                      <button
                        type="button"
                        disabled={isBusy}
                        title="View Details & Comments"
                        aria-label={`View ${task.title}`}
                        onClick={() => openTaskDetails(task)}
                        className="rounded-xl border border-line bg-surface2 p-1.5 text-ink transition hover:border-accent disabled:opacity-50"
                      >
                        <Eye className="h-4 w-4 text-accent" />
                      </button>

                      {canManage && canModifyTask(task) && (

                        <>

                          <button
                            type="button"
                            disabled={isBusy}
                            title="Edit Task"
                            aria-label={`Edit ${task.title}`}
                            onClick={() => openEditTask(task)}
                            className="rounded-xl border border-line bg-surface2 p-1.5 text-ink transition hover:border-accent disabled:opacity-50"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            title="Delete Task"
                            aria-label={`Delete ${task.title}`}
                            onClick={() => openDeleteTask(task)}
                            className="rounded-xl border border-line bg-surface2 p-1.5 text-muted transition hover:border-bad hover:text-bad disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                        </>

                      )}

                    </div>

                  </div>

                );
              })}

            </div>

          )}

        </section>

      )}


      {/* KANBAN BOARD */}

      {viewMode === 'board' && (

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

          {boardStatuses.map(columnStatus => {

            const columnTasks = filteredTasks.filter(
              task => getTaskStatus(task) === columnStatus
            );

            return (

              <section
                key={columnStatus}
                className="glass-card !p-3 space-y-3"
              >

                <div className="flex w-full items-center justify-between border-b border-line/60 pb-2">

                  <span className="font-display text-xs font-bold uppercase tracking-wider text-ink">
                    {columnStatus}
                  </span>

                  <span className="rounded-full bg-surface2 px-2 py-1 font-data text-xs font-bold text-accent">
                    {columnTasks.length}
                  </span>

                </div>

                <div className="w-full space-y-2.5 overflow-y-auto pr-1">

                  {!columnTasks.length && (

                    <p className="py-6 text-center text-xs text-muted">
                      No tasks
                    </p>

                  )}

                  {columnTasks.map(task => (

                    <button
                      type="button"
                      key={task.id}
                      disabled={isBusy}
                      onClick={() => openTaskDetails(task)}
                      className="w-full space-y-3 rounded-xl border border-line/50 bg-surface2/60 p-3 text-left transition hover:border-accent/40 disabled:opacity-50"
                    >

                      <div className="flex flex-wrap items-center justify-between gap-1">

                        <PriorityBadge priority={task.priority} />

                        <span className="text-[10px] font-medium text-accent">
                          {task.category || 'General'}
                        </span>

                      </div>

                      <h5 className="text-xs font-semibold leading-snug text-ink">
                        {task.title}
                      </h5>

                      {findProject(task.projectId) && (

                        <p className="text-[10px] text-muted">
                          {findProject(task.projectId).name}
                        </p>

                      )}

                      <div className="flex items-center justify-between gap-2 border-t border-line/30 pt-2 text-[11px] text-muted">

                        <span className="flex items-center gap-1 font-medium text-ink">
                          <Avatar
                            name={task.assigneeName || 'Team Member'}
                            size="sm"
                          />

                          {String(task.assigneeName || 'Team Member')
                            .split(' ')[0]}
                        </span>

                        <span>
                          {displayDate(task.dueDate)}
                        </span>

                      </div>

                      <TaskProgress
                        task={task}
                        overdue={isOverdue(task, today)}
                      />

                      {isOverdue(task, today) && (

                        <p className="text-[10px] font-semibold text-bad">
                          Overdue
                        </p>

                      )}

                    </button>

                  ))}

                </div>

              </section>

            );
          })}

        </div>

      )}


      {/* CREATE AND EDIT TASK MODAL */}

      {isFormOpen && canManage && (

        <ModalPortal
          onClose={closeTaskForm}
          ariaLabelledby="task-form-title"
        >

          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border !border-[#34515b] !bg-[#142c37] p-5 text-white shadow-2xl">

            <div className="mb-4 flex items-start justify-between border-b border-line/60 pb-3">

              <div>

                <h3
                  id="task-form-title"
                  className="font-display text-lg font-bold text-ink"
                >
                  {editingTaskId ? 'Edit Task' : 'Create New Task'}
                </h3>

                <p className="mt-1 text-xs text-muted">
                  {editingTaskId
                    ? 'Update existing task details and assignments.'
                    : 'Create and assign a task to your authorized team.'}
                </p>

              </div>

              <button
                type="button"
                disabled={isBusy}
                onClick={closeTaskForm}
                className="rounded-lg p-2 text-muted hover:bg-surface2 hover:text-ink disabled:opacity-50"
                aria-label="Close task form"
              >
                <X className="h-4 w-4" />
              </button>

            </div>

            <form onSubmit={handleSaveTask}>

              <fieldset
                disabled={isBusy}
                className="grid min-w-0 gap-4 sm:grid-cols-2"
              >

                <label className="space-y-1 sm:col-span-2">

                  <span className="text-xs font-semibold text-muted">
                    Task Title *
                  </span>

                  <input
                    required
                    maxLength={150}
                    value={taskForm.title}
                    onChange={event =>
                      updateFormField('title', event.target.value)
                    }
                    placeholder="Enter task title"
                    className={INPUT_CLASS}
                  />

                </label>

                <label className="space-y-1 sm:col-span-2">

                  <span className="text-xs font-semibold text-muted">
                    Description
                  </span>

                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={taskForm.description}
                    onChange={event =>
                      updateFormField('description', event.target.value)
                    }
                    placeholder="Enter task requirements"
                    className={INPUT_CLASS}
                  />

                  <span className="block text-right text-[10px] text-muted">
                    {taskForm.description.length}/1000
                  </span>

                </label>

                <label className="space-y-1 sm:col-span-2">

                  <span className="text-xs font-semibold text-muted">
                    Linked Project
                  </span>

                  <select
                    value={taskForm.projectId}
                    onChange={event =>
                      updateFormField('projectId', event.target.value)
                    }
                    className={SELECT_CLASS}
                  >

                    <option value="">
                      No Project - Independent Task
                    </option>

                    {taskForm.projectId && !selectedFormProject && (

                      <option value={taskForm.projectId} disabled>
                        Existing project unavailable
                      </option>

                    )}

                    {authorizedProjects.map(project => (

                      <option
                        key={project.id}
                        value={project.id}
                        disabled={project.status === 'Completed'}
                      >
                        {project.projectCode || project.id}
                        {' - '}
                        {project.name}
                        {project.status === 'Completed'
                          ? ' (Completed)'
                          : ''}
                      </option>

                    ))}

                  </select>

                </label>

                <label className="space-y-1">

                  <span className="text-xs font-semibold text-muted">
                    Assign To *
                  </span>

                  <select
                    required
                    value={taskForm.assigneeId}
                    onChange={event =>
                      updateFormField('assigneeId', event.target.value)
                    }
                    className={SELECT_CLASS}
                  >

                    <option value="">
                      Select employee
                    </option>

                    {formMembers.map(member => (

                      <option
                        key={getMemberId(member)}
                        value={getMemberId(member)}
                      >
                        {member.name}
                        {' - '}
                        {getMemberId(member)}
                      </option>

                    ))}

                  </select>

                  {selectedFormProject && (

                    <p className="text-[10px] text-muted">
                      Only authorized project members are available.
                    </p>

                  )}

                </label>

                <label className="space-y-1">

                  <span className="text-xs font-semibold text-muted">
                    Category
                  </span>

                  <select
                    value={taskForm.category}
                    onChange={event =>
                      updateFormField('category', event.target.value)
                    }
                    className={SELECT_CLASS}
                  >
                    {categories.map(category => (

                      <option key={category} value={category}>
                        {category}
                      </option>

                    ))}
                  </select>

                </label>

                <label className="space-y-1">

                  <span className="text-xs font-semibold text-muted">
                    Start Date *
                  </span>

                  <input
                    required
                    type="date"
                    min={selectedFormProject?.startDate || undefined}
                    max={selectedFormProject?.dueDate || undefined}
                    value={taskForm.startDate}
                    onChange={event =>
                      updateFormField('startDate', event.target.value)
                    }
                    className={INPUT_CLASS}
                  />

                </label>

                <label className="space-y-1">

                  <span className="text-xs font-semibold text-muted">
                    Due Date *
                  </span>

                  <input
                    required
                    type="date"
                    min={taskForm.startDate || undefined}
                    max={selectedFormProject?.dueDate || undefined}
                    value={taskForm.dueDate}
                    onChange={event =>
                      updateFormField('dueDate', event.target.value)
                    }
                    className={INPUT_CLASS}
                  />

                </label>

                <label className="space-y-1">

                  <span className="text-xs font-semibold text-muted">
                    Priority
                  </span>

                  <select
                    value={taskForm.priority}
                    onChange={event =>
                      updateFormField('priority', event.target.value)
                    }
                    className={SELECT_CLASS}
                  >
                    {TASK_PRIORITIES.map(priority => (

                      <option key={priority} value={priority}>
                        {priority}
                      </option>

                    ))}
                  </select>

                </label>

                <label className="space-y-1">

                  <span className="text-xs font-semibold text-muted">
                    Status
                  </span>

                  <select
                    value={taskForm.status}
                    onChange={event =>
                      updateFormField('status', event.target.value)
                    }
                    className={SELECT_CLASS}
                  >
                    {TASK_STATUSES.map(status => (

                      <option key={status} value={status}>
                        {status}
                      </option>

                    ))}
                  </select>

                </label>

                <div className="space-y-2 sm:col-span-2">

                  <div className="flex items-center justify-between">

                    <span className="text-xs font-semibold text-muted">
                      Task Progress
                    </span>

                    <span className="font-data text-xs font-bold text-accent">
                      {taskForm.progress}%
                    </span>

                  </div>

                  <input
                    type="range"
                    min={0}
                    max={taskForm.status === 'Completed' ? 100 : 99}
                    step={1}
                    value={taskForm.progress}
                    disabled={
                      isBusy ||
                      taskForm.status === 'To Do' ||
                      taskForm.status === 'Completed'
                    }
                    onChange={event =>
                      updateFormField(
                        'progress',
                        Number(event.target.value)
                      )
                    }
                    className="w-full accent-teal-400 disabled:opacity-50"
                  />

                  <p className="text-[10px] text-muted">
                    Completed tasks automatically reach 100% progress.
                  </p>

                </div>

              </fieldset>

              <div className="mt-4">
                <ErrorMessage message={formError} />
              </div>

              <div className="mt-4 flex justify-end gap-2 border-t border-line/60 pt-3">

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={closeTaskForm}
                  className={`${BUTTON_CLASS} border border-line bg-surface2 text-ink`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isBusy}
                  className={`${BUTTON_CLASS} inline-flex items-center gap-2 bg-accent text-on-accent`}
                >

                  {busyAction === 'save-task' && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {busyAction === 'save-task'
                    ? 'Saving...'
                    : editingTaskId
                      ? 'Update Task'
                      : 'Create Task'}

                </button>

              </div>

            </form>

          </div>

        </ModalPortal>

      )}


      {/* LIVE TASK DETAILS MODAL */}

      {detailTask && !isFormOpen && (

        <ModalPortal
          onClose={closeTaskDetails}
          ariaLabelledby="task-detail-title"
        >

          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border !border-[#34515b] !bg-[#142c37] p-5 text-white shadow-2xl">

            <div className="flex items-start justify-between gap-2 border-b border-line/60 pb-3">

              <div>

                <div className="flex flex-wrap items-center gap-2">

                  <PriorityBadge priority={detailTask.priority} />

                  <StatusBadge
                    status={getTaskStatus(detailTask)}
                  />

                  {isOverdue(detailTask, today) && (

                    <span className="rounded-full bg-bad/10 px-2 py-1 text-[10px] text-bad">
                      Overdue
                    </span>

                  )}

                </div>

                <h3
                  id="task-detail-title"
                  className="mt-2 font-display text-base font-bold text-white"
                >
                  {detailTask.title}
                </h3>

                <p className="mt-1 text-[10px] text-muted">
                  {detailTask.id}
                </p>

              </div>

              <button
                type="button"
                disabled={isBusy}
                onClick={closeTaskDetails}
                aria-label="Close task details"
                className="rounded-lg p-2 text-muted hover:bg-white/10 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>

            </div>

            <p className="my-3 whitespace-pre-wrap break-words text-xs leading-relaxed text-muted">
              {detailTask.description || 'No description provided.'}
            </p>

            <div className="mb-3 grid grid-cols-2 gap-3 rounded-xl border border-line/50 bg-surface2/60 p-3 text-xs">

              <div>

                <span className="block text-[10px] text-muted">
                  Assignee
                </span>

                <span className="font-semibold text-ink">
                  {detailTask.assigneeName || 'Not assigned'}
                </span>

              </div>

              <div>

                <span className="block text-[10px] text-muted">
                  Category
                </span>

                <span className="font-semibold text-ink">
                  {detailTask.category || 'General'}
                </span>

              </div>

              <div>

                <span className="block text-[10px] text-muted">
                  Start Date
                </span>

                <span className="font-semibold text-ink">
                  {displayDate(detailTask.startDate)}
                </span>

              </div>

              <div>

                <span className="block text-[10px] text-muted">
                  Due Date
                </span>

                <span className="font-semibold text-ink">
                  {displayDate(detailTask.dueDate)}
                </span>

              </div>

              <div className="col-span-2">

                <span className="block text-[10px] text-muted">
                  Linked Project
                </span>

                <span className="font-semibold text-accent">
                  {findProject(detailTask.projectId)?.name ||
                    (
                      detailTask.projectId
                        ? 'Project details unavailable'
                        : 'Independent Task'
                    )}
                </span>

              </div>

              <div className="col-span-2">

                <TaskProgress
                  task={detailTask}
                  overdue={isOverdue(detailTask, today)}
                />

              </div>

            </div>


            {/* STATUS AND PROGRESS ACTIONS */}

            {canModifyTask(detailTask) && (

              <div className="mb-4 space-y-3 rounded-xl border border-line/50 bg-surface2/40 p-3">

                <div className="flex items-center justify-between gap-2">

                  <span className="text-xs font-semibold text-ink">
                    Update Status
                  </span>

                  {renderStatusSelect(detailTask)}

                </div>

                {['In Progress', 'In Review'].includes(
                  getTaskStatus(detailTask)
                ) && (

                  <form
                    onSubmit={handleProgressUpdate}
                    className="flex flex-wrap items-center gap-2 border-t border-line/50 pt-3"
                  >

                    <label className="flex-1 space-y-1">

                      <span className="text-xs text-muted">
                        Update Progress (%)
                      </span>

                      <input
                        type="number"
                        min={0}
                        max={99}
                        required
                        disabled={isBusy}
                        value={
                          progressDraft === ''
                            ? getProgress(detailTask)
                            : progressDraft
                        }
                        onChange={event =>
                          setProgressDraft(event.target.value)
                        }
                        className={INPUT_CLASS}
                      />

                    </label>

                    <button
                      type="submit"
                      disabled={
                        isBusy ||
                        progressDraft === ''
                      }
                      className={`${BUTTON_CLASS} mt-4 bg-accent text-on-accent`}
                    >
                      Save Progress
                    </button>

                  </form>

                )}

              </div>

            )}

            {projectLocked(detailTask) && (

              <p className="mb-3 rounded-xl border border-good/30 bg-good/10 p-3 text-xs text-good">
                This task belongs to a completed project.
                Reopen the project before editing the task.
              </p>

            )}

            <ErrorMessage message={actionError} />


            {/* DISCUSSION AND COMMENTS */}

            <div className="my-4 space-y-3">

              <div className="flex items-center justify-between">

                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  Discussion & Review Notes
                </span>

                <span className="text-[10px] text-muted">
                  {safeArray(detailTask.comments).length} comments
                </span>

              </div>

              <div className="max-h-48 space-y-2 overflow-y-auto pr-1">

                {!safeArray(detailTask.comments).length && (

                  <p className="py-3 text-xs text-muted">
                    No comments yet.
                  </p>

                )}

                {safeArray(detailTask.comments).map((comment, index) => (

                  <div
                    key={comment?.id || index}
                    className="rounded-lg border border-line/30 bg-surface2/40 p-3 text-xs"
                  >

                    <div className="mb-1 flex flex-wrap justify-between gap-2 text-[10px] text-muted">

                      <strong className="text-accent">
                        {comment?.author || 'Team Member'}
                      </strong>

                      <span>
                        {comment?.timestamp &&
                         !Number.isNaN(
                           new Date(comment.timestamp).getTime()
                         )
                          ? new Date(comment.timestamp).toLocaleString()
                          : comment?.time || ''}
                      </span>

                    </div>

                    <p className="whitespace-pre-wrap break-words text-ink">
                      {typeof comment === 'string'
                        ? comment
                        : comment?.text || comment?.message || ''}
                    </p>

                  </div>

                ))}

              </div>

              <form
                onSubmit={handleCommentSubmit}
                className="space-y-2"
              >

                <textarea
                  rows={2}
                  required
                  maxLength={MAX_COMMENT_LENGTH}
                  disabled={isBusy}
                  placeholder="Add a comment or sprint review note..."
                  value={newCommentText}
                  onChange={event => {
                    setNewCommentText(event.target.value);
                    setCommentError('');
                  }}
                  className={INPUT_CLASS}
                />

                <div className="flex items-center justify-between">

                  <span className="text-[10px] text-muted">
                    {newCommentText.length}/{MAX_COMMENT_LENGTH}
                  </span>

                  <button
                    type="submit"
                    disabled={
                      isBusy ||
                      !newCommentText.trim()
                    }
                    className={`${BUTTON_CLASS} flex items-center gap-1.5 bg-accent text-on-accent`}
                  >

                    {busyAction === 'comment'
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Send className="h-3.5 w-3.5" />}

                    {busyAction === 'comment'
                      ? 'Sending...'
                      : 'Send'}

                  </button>

                </div>

              </form>

              <ErrorMessage message={commentError} />

            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-line/60 pt-3">

              {canManage && canModifyTask(detailTask) && (

                <>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => openDeleteTask(detailTask)}
                    className={`${BUTTON_CLASS} flex items-center gap-1.5 border border-bad/30 bg-bad/10 text-bad`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => openEditTask(detailTask)}
                    className={`${BUTTON_CLASS} flex items-center gap-1.5 bg-accent text-on-accent`}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit Task
                  </button>

                </>

              )}

              <button
                type="button"
                disabled={isBusy}
                onClick={closeTaskDetails}
                className={`${BUTTON_CLASS} border border-line bg-surface2 text-ink`}
              >
                Close
              </button>

            </div>

          </div>

        </ModalPortal>

      )}


      {/* DELETE CONFIRMATION MODAL */}

      {taskToDelete && (

        <ModalPortal
          onClose={closeDeleteTask}
          ariaLabelledby="delete-task-title"
        >

          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-[#34515b] bg-[#142c37] p-5 shadow-2xl">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-bad/10 p-3 text-bad">
                <Trash2 className="h-5 w-5" />
              </div>

              <h3
                id="delete-task-title"
                className="font-display text-base font-bold text-ink"
              >
                Delete Team Task
              </h3>

            </div>

            <p className="text-xs leading-relaxed text-muted">
              Are you sure you want to delete
              {' "'}
              {taskToDelete.title}
              {'"? '}
              This will remove the task from the task directory
              and its linked project.
            </p>

            <ErrorMessage message={actionError} />

            <div className="flex justify-end gap-2 border-t border-line/60 pt-3">

              <button
                type="button"
                disabled={isBusy}
                onClick={closeDeleteTask}
                className={`${BUTTON_CLASS} border border-line bg-surface2 text-ink`}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isBusy}
                onClick={handleDeleteTask}
                className={`${BUTTON_CLASS} flex items-center gap-2 bg-bad text-[#142c37]`}
              >

                {busyAction === 'delete' && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {busyAction === 'delete'
                  ? 'Deleting...'
                  : 'Delete Task'}

              </button>

            </div>

          </div>

        </ModalPortal>

      )}

    </div>

  );
};

export default Tasks;
