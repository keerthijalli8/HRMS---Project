import React, {
  useMemo,
  useState,
  useRef
} from 'react';

import { useTeamLead } from '../../context/TeamLeadContext.jsx';
import { Avatar } from '../../components/common/Avatar.jsx';
import { ModalPortal } from '../../components/common/ModalPortal.jsx';
import { formatDate } from '../../utils/helpers.js';

import {
  canManageProjects,
  canAccessProject,
  canAssignTasks,
  isSuperAdminUser,
  getUserRole,
  userIdOf
} from '../../utils/dataScope.js';

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ListTodo,
  MessageSquare,
  Plus,
  Search,
  Send,
  Users,
  X
} from 'lucide-react';


// ============================================================
// PROJECT CONFIGURATION
// ============================================================

const PROJECT_STATUSES = [
  'Planning',
  'In Progress',
  'Completed'
];

const PROJECT_PRIORITIES = [
  'High',
  'Medium',
  'Low'
];

const TASK_STATUSES = [
  'To Do',
  'In Progress',
  'Completed'
];

const MAX_COMMENT_LENGTH = 500;


// ============================================================
// HELPERS
// ============================================================

const sameId = (first, second) =>
  Boolean(String(first ?? '').trim()) &&
  String(first ?? '').trim().toLowerCase() ===
  String(second ?? '').trim().toLowerCase();

const normalize = value =>
  String(value ?? '').trim().toLowerCase();

const getMemberId = member =>
  String(member?.id || member?.employeeId || '');

const getToday = () => {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const isCompletedTask = task =>
  ['completed', 'done'].includes(
    normalize(task.status)
  );

const clampProgress = value =>
  Math.min(
    100,
    Math.max(0, Number(value) || 0)
  );

const calculateProgress = (project, tasks) => {
  if (!tasks.length) {
    return project.status === 'Completed'
      ? 100
      : clampProgress(project.progress);
  }

  return Math.round(
    tasks.reduce(
      (total, task) =>
        total + (
          isCompletedTask(task)
            ? 100
            : clampProgress(task.progress)
        ),
      0
    ) / tasks.length
  );
};


// ============================================================
// STATUS STYLING
// ============================================================

const statusTone = status => {

  const value = normalize(status);

  if (value === 'completed') {
    return 'border-good/30 bg-good/10 text-good';
  }

  if (value === 'planning') {
    return 'border-info/30 bg-info/10 text-info';
  }

  if (value === 'in progress') {
    return 'border-accent/30 bg-accent/10 text-accent';
  }

  if (value === 'on hold') {
    return 'border-warn/30 bg-warn/10 text-warn';
  }

  return 'border-line bg-surface2 text-muted';
};
const priorityTone = priority =>
  priority === 'High'
    ? 'border-bad/30 bg-bad/10 text-bad'
    : priority === 'Medium'
      ? 'border-warn/30 bg-warn/10 text-warn'
      : 'border-good/30 bg-good/10 text-good';

const healthTone = health => {

  const value = normalize(health);

  if (value === 'at risk') {
    return 'border-warn/30 bg-warn/10 text-warn';
  }

  if (['off track', 'blocked'].includes(value)) {
    return 'border-bad/30 bg-bad/10 text-bad';
  }

  if (['on track', 'healthy'].includes(value)) {
    return 'border-good/30 bg-good/10 text-good';
  }

  return 'border-line bg-surface2 text-muted';
};


// ============================================================
// INITIAL FORM VALUES
// ============================================================

const initialForm = () => ({
  name: '',
  projectCode: '',
  department: '',
  description: '',
  startDate: getToday(),
  dueDate: '',
  priority: 'Medium',
  status: 'Planning',
  memberIds: [],
  memberRoles: {}
});

const initialTaskForm = () => ({
  title: '',
  assigneeId: '',
  dueDate: '',
  status: 'To Do'
});


// ============================================================
// MAIN PROJECT COMPONENT
// ============================================================

export const Projects = () => {

  const {
    triggerToast,
    projects = [],
    createProject,
    addProjectComment,
    updateProject,
    addMilestone,
    updateMilestone,
    currentUser,
    teamMembers = [],
    tasks = [],
    createTask,
    globalSearchTerm = ''
  } = useTeamLead();

  const canManage =
    canManageProjects(currentUser);

  const canAssign =
    canAssignTasks(currentUser);

  const [searchTerm, setSearchTerm] =
    useState('');

  const [selectedStatus, setSelectedStatus] =
    useState('All');

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [newProject, setNewProject] =
    useState(initialForm);

  const [selectedProjectId, setSelectedProjectId] =
    useState(null);

  const [isClosingDetails, setIsClosingDetails] =
    useState(false);

  const [isSavingProject, setIsSavingProject] =
    useState(false);

  const [taskForm, setTaskForm] =
    useState(initialTaskForm);

  const [isSavingTask, setIsSavingTask] =
    useState(false);

  const [projectCommentText, setProjectCommentText] =
    useState('');

  const [
    isSavingProjectComment,
    setIsSavingProjectComment
  ] = useState(false);

  const [projectError, setProjectError] =
    useState('');

  const [taskError, setTaskError] =
    useState('');

  const [commentError, setCommentError] =
    useState('');

  const [editingProjectId, setEditingProjectId] =
    useState(null);

  const [milestoneTitle, setMilestoneTitle] =
    useState('');

  const [milestoneError, setMilestoneError] =
    useState('');

  const [
    isSavingMilestone,
    setIsSavingMilestone
  ] = useState(false);

  const savingMilestoneRef = useRef(false);

  const savingProjectRef = useRef(false);
  const savingTaskRef = useRef(false);
  const savingCommentRef = useRef(false);


// ============================================================
// AUTHORIZED PROJECT DATA
// ============================================================

  const authorizedProjects = useMemo(() =>
    projects.filter(project =>
      canAccessProject(
        currentUser,
        project,
        teamMembers
      )
    ),
    [projects, currentUser, teamMembers]
  );

  const authorizedMemberIds = useMemo(
    () => new Set(
      teamMembers
        .map(getMemberId)
        .filter(Boolean)
    ),
    [teamMembers]
  );

  const findTeamMember = id =>
    teamMembers.find(member =>
      sameId(getMemberId(member), id)
    );

  const effectiveSearch = normalize(
    searchTerm || globalSearchTerm
  );


// ============================================================
// PROJECT FILTERS
// ============================================================

  const filteredProjects = useMemo(() => {
    return authorizedProjects.filter(project => {

      const matchesSearch = normalize(
        `${project.name || ''} ${
          project.projectCode || ''
        } ${
          project.department || ''
        } ${
          project.description || ''
        }`
      ).includes(effectiveSearch);

      const matchesStatus =
        selectedStatus === 'All' ||
        project.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });

  }, [
    authorizedProjects,
    effectiveSearch,
    selectedStatus
  ]);


// ============================================================
// SELECTED PROJECT
// ============================================================

  const selectedProject =
    authorizedProjects.find(project =>
      sameId(project.id, selectedProjectId)
    ) || null;

  const editingProject =
    authorizedProjects.find(item =>
      sameId(item.id, editingProjectId)
    ) || null;

  const canEditSelectedProject =
    Boolean(
      selectedProject &&
      canManage &&
      (
        isSuperAdminUser(currentUser) ||
        sameId(
          selectedProject.ownerId,
          userIdOf(currentUser)
        ) ||
        sameId(
          selectedProject.teamLeadId,
          userIdOf(currentUser)
        ) ||
        (
          getUserRole(currentUser) === 'manager' &&
          authorizedMemberIds.has(
            String(selectedProject.teamLeadId)
          )
        )
      )
    );

  const hasRestrictedMembers =
    Boolean(
      editingProject &&
      (editingProject.memberIds || []).some(
        id => !authorizedMemberIds.has(String(id))
      )
    );

  const projectTasks = selectedProject
    ? tasks.filter(task =>
        sameId(
          task.projectId,
          selectedProject.id
        )
      )
    : [];

  const completedTaskCount =
    projectTasks.filter(
      isCompletedTask
    ).length;

  const progress = selectedProject
    ? calculateProgress(
        selectedProject,
        projectTasks
      )
    : 0;


// ============================================================
// AUTHORIZED PROJECT MEMBERS
// ============================================================

  const assignedMembers = selectedProject
    ? [
        ...new Set(
          (selectedProject.memberIds || [])
            .map(String)
        )
      ]
        .map(memberId =>
          findTeamMember(memberId)
        )
        .filter(Boolean)
    : [];

  const assignableMembers =
    assignedMembers.filter(member =>
      authorizedMemberIds.has(
        getMemberId(member)
      )
    );

  const minimumTaskDate =
    selectedProject?.startDate &&
    selectedProject.startDate > getToday()
      ? selectedProject.startDate
      : getToday();


// ============================================================
// OPEN AND CLOSE PROJECT DETAILS
// ============================================================

  const openProjectDetails = project => {

    if (
      !canAccessProject(
        currentUser,
        project,
        teamMembers
      )
    ) {
      triggerToast(
        'You do not have access to this project.',
        'error'
      );

      return;
    }

    setTaskForm(initialTaskForm());
    setProjectCommentText('');

    setTaskError('');
    setCommentError('');

    setMilestoneTitle('');
    setMilestoneError('');
    setSelectedProjectId(project.id);
  };

  const closeProjectDetails = () => {

    if (
      !selectedProjectId ||
      isClosingDetails ||
      savingMilestoneRef.current ||
      savingTaskRef.current ||
      savingCommentRef.current
    ) {
      return;
    }

    setIsClosingDetails(true);

    window.setTimeout(() => {

      setSelectedProjectId(null);
      setIsClosingDetails(false);

      setTaskForm(initialTaskForm());
      setProjectCommentText('');

      setTaskError('');
      setCommentError('');

    }, 150);
  };


// ============================================================
// PROJECT CREATION MODAL
// ============================================================

  const openEditProjectModal = () => {
    if (
      !canEditSelectedProject ||
      !selectedProject ||
      savingTaskRef.current ||
      savingCommentRef.current ||
      savingMilestoneRef.current
    ) {
      return;
    }

    setEditingProjectId(selectedProject.id);

    setNewProject({
      name: selectedProject.name || '',
      projectCode:
        selectedProject.projectCode ||
        selectedProject.id,

      department:
        selectedProject.department || '',

      description:
        selectedProject.description || '',

      startDate:
        selectedProject.startDate || '',

      dueDate:
        selectedProject.dueDate || '',

      priority:
        selectedProject.priority || 'Medium',

      status:
        selectedProject.status || 'Planning',

      memberIds:
        (selectedProject.memberIds || []).map(String),

      memberRoles:
        { ...(selectedProject.memberRoles || {}) }
    });

    setProjectError('');
    setIsModalOpen(true);
  };

  const openCreateProjectModal = () => {
    setEditingProjectId(null);

    if (!canManage) {
      triggerToast(
        'You do not have permission to create projects.',
        'error'
      );

      return;
    }

    setNewProject(initialForm());
    setProjectError('');
    setIsModalOpen(true);
  };

  const closeCreateProjectModal = () => {

    if (savingProjectRef.current) return;

    setEditingProjectId(null);
    setIsModalOpen(false);
    setProjectError('');
    setNewProject(initialForm());
  };


// ============================================================
// PROJECT FORM VALIDATION
// ============================================================

  const validateProject = () => {

    if (!canManage) {
      return 'You do not have permission to create projects.';
    }

    if (
      !newProject.name.trim() ||
      !newProject.projectCode.trim() ||
      !newProject.department.trim() ||
      !newProject.description.trim() ||
      !newProject.startDate ||
      !newProject.dueDate
    ) {
      return 'Complete all required project fields.';
    }

    if (
      !/^[A-Z0-9][A-Z0-9_-]*$/.test(
        newProject.projectCode.trim().toUpperCase()
      )
    ) {
      return 'Project code must contain letters, numbers, hyphens or underscores.';
    }

    if (
      newProject.dueDate <
      newProject.startDate
    ) {
      return 'Deadline must be on or after the start date.';
    }

    if (
      !PROJECT_STATUSES.includes(
        newProject.status
      ) ||
      !PROJECT_PRIORITIES.includes(
        newProject.priority
      )
    ) {
      return 'Choose a valid project status and priority.';
    }

    if (
      editingProject &&
      newProject.status === 'Completed' &&
      (editingProject.milestones || []).some(
        milestone => !milestone.done
      )
    ) {
      return 'Complete all project milestones before closing the project.';
    }

    const duplicateCode =
      authorizedProjects.some(project =>
        !sameId(project.id, editingProjectId) &&
        normalize(project.projectCode) ===
        normalize(newProject.projectCode)
      );

    if (duplicateCode) {
      return 'This project code already exists.';
    }

    if (
      !hasRestrictedMembers &&
      newProject.memberIds.some(memberId =>
        !authorizedMemberIds.has(
          String(memberId)
        )
      )
    ) {
      return 'Only authorized team members can be assigned.';
    }

    if (
      !hasRestrictedMembers &&
      newProject.memberIds.some(memberId =>
        !String(
          newProject.memberRoles[memberId] || ''
        ).trim()
      )
    ) {
      return 'Assign a project role to every selected team member.';
    }

    if (
      !hasRestrictedMembers &&
      newProject.memberIds.some(memberId =>
        String(
          newProject.memberRoles[memberId] || ''
        ).trim().length > 60
      )
    ) {
      return 'Project roles cannot exceed 60 characters.';
    }

    return '';
  };


// ============================================================
// CREATE PROJECT
// ============================================================

  const handleCreateProject = async event => {

    event.preventDefault();

    if (savingProjectRef.current) return;

    setProjectError('');

    const validationError =
      validateProject();

    if (validationError) {

      setProjectError(validationError);

      triggerToast(
        validationError,
        'warn'
      );

      return;
    }

    savingProjectRef.current = true;
    setIsSavingProject(true);

    try {

      const memberIds = [
        ...new Set(
          newProject.memberIds.map(String)
        )
      ];

      const memberRoles =
        Object.fromEntries(
          memberIds.map(memberId => [
            memberId,
            String(
              newProject.memberRoles[memberId] || ''
            ).trim()
          ])
        );

      const payload = {

        ...newProject,

        name:
          newProject.name.trim(),

        projectCode:
          newProject.projectCode
            .trim()
            .toUpperCase(),

        department:
          newProject.department.trim(),

        description:
          newProject.description.trim(),

        memberIds,
        memberRoles,

        progress:
          newProject.status === 'Completed'
            ? 100
            : 0,

        activeSprint: null
      };

      if (editingProjectId) {
        if (!editingProject || !canEditSelectedProject) {
          throw new Error(
            'Project editing permission is required.'
          );
        }

        delete payload.progress;
        delete payload.activeSprint;

        if (hasRestrictedMembers) {
          delete payload.memberIds;
          delete payload.memberRoles;
        }
      }

      const created = editingProjectId
        ? await updateProject(
            editingProjectId,
            payload
          )
        : await createProject(payload);

      if (!created?.id) {
        throw new Error(
          'Project creation could not be confirmed.'
        );
      }

      setIsModalOpen(false);
      setEditingProjectId(null);
      setNewProject(initialForm());

      setTaskForm(initialTaskForm());
      setProjectCommentText('');

      setSelectedProjectId(created.id);

      triggerToast(
        editingProjectId
          ? 'Project updated successfully.'
          : 'Project created successfully.',
        'good'
      );

    } catch (error) {

      const message =
        error.message ||
        'Project could not be created.';

      setProjectError(message);

      triggerToast(
        message,
        'error'
      );

    } finally {

      savingProjectRef.current = false;
      setIsSavingProject(false);

    }
  };


// ============================================================
// TEAM MEMBER SELECTION
// ============================================================

  const selectMembers = event => {

    const selectedIds = Array.from(
      event.target.selectedOptions,
      option => option.value
    ).filter(id =>
      authorizedMemberIds.has(id)
    );

    setNewProject(current => {

      const memberRoles =
        selectedIds.reduce(
          (roles, memberId) => {

            const member =
              findTeamMember(memberId);

            roles[memberId] =
              current.memberRoles[memberId] ||
              member?.designation ||
              'Team Member';

            return roles;
          },
          {}
        );

      return {
        ...current,
        memberIds: selectedIds,
        memberRoles
      };
    });

    setProjectError('');
  };


// ============================================================
// ADD PROJECT TASK
// ============================================================

  const handleAddTask = async event => {

    event.preventDefault();

    if (savingTaskRef.current) return;

    setTaskError('');

    const fail = message => {
      setTaskError(message);
      triggerToast(message, 'warn');
    };

    if (!canAssign || !selectedProject) {
      fail(
        'You do not have permission to assign project tasks.'
      );
      return;
    }

    if (
      selectedProject.status === 'Completed'
    ) {
      fail(
        'New tasks cannot be assigned to a completed project.'
      );
      return;
    }

    if (
      !taskForm.title.trim() ||
      !taskForm.assigneeId ||
      !taskForm.dueDate
    ) {
      fail(
        'Enter a task title, assignee and due date.'
      );
      return;
    }

    const assignee =
      assignableMembers.find(member =>
        sameId(
          getMemberId(member),
          taskForm.assigneeId
        )
      );

    if (!assignee) {
      fail(
        'Select an authorized member assigned to this project.'
      );
      return;
    }

    if (
      taskForm.dueDate < minimumTaskDate
    ) {
      fail(
        'Task due date cannot be before the task start date.'
      );
      return;
    }

    if (
      selectedProject.dueDate &&
      taskForm.dueDate >
        selectedProject.dueDate
    ) {
      fail(
        'Task due date cannot exceed the project deadline.'
      );
      return;
    }

    if (
      !TASK_STATUSES.includes(taskForm.status)
    ) {
      fail('Choose a valid task status.');
      return;
    }

    savingTaskRef.current = true;
    setIsSavingTask(true);

    try {

      const createdTask = await createTask({

        title:
          taskForm.title.trim(),

        description:
          `Project task for ${selectedProject.name}.`,

        assigneeId:
          getMemberId(assignee),

        assigneeName:
          assignee.name,

        category: 'Project',

        priority:
          selectedProject.priority,

        status:
          taskForm.status,

        startDate:
          minimumTaskDate,

        dueDate:
          taskForm.dueDate,

        projectId:
          selectedProject.id,

        progress:
          taskForm.status === 'Completed'
            ? 100
            : 0

      });

      if (!createdTask?.id) {
        throw new Error(
          'Task creation could not be confirmed.'
        );
      }

      setTaskForm(initialTaskForm());

      triggerToast(
        'Project task added.',
        'good'
      );

    } catch (error) {

      const message =
        error.message ||
        'Task could not be added.';

      setTaskError(message);

      triggerToast(
        message,
        'error'
      );

    } finally {

      savingTaskRef.current = false;
      setIsSavingTask(false);

    }
  };


// ============================================================
// PROJECT COMMENTS
// ============================================================

  const handleMilestoneChange = async (
    milestone = null
  ) => {
    if (
      !selectedProject ||
      !canEditSelectedProject ||
      savingMilestoneRef.current ||
      selectedProject.status === 'Completed'
    ) {
      return;
    }

    if (
      !milestone &&
      !milestoneTitle.trim()
    ) {
      setMilestoneError(
        'Enter a milestone title.'
      );

      return;
    }

    savingMilestoneRef.current = true;

    setIsSavingMilestone(true);
    setMilestoneError('');

    try {
      let result;

      if (milestone) {
        result = await updateMilestone(
          selectedProject.id,
          milestone.id,
          !milestone.done
        );
      } else {
        result = await addMilestone(
          selectedProject.id,
          milestoneTitle.trim()
        );
      }

      if (!result?.id) {
        throw new Error(
          'Milestone update could not be confirmed.'
        );
      }

      if (!milestone) {
        setMilestoneTitle('');
      }

    } catch (error) {
      setMilestoneError(
        error?.message ||
        'Unable to update milestone.'
      );

    } finally {
      savingMilestoneRef.current = false;
      setIsSavingMilestone(false);
    }
  };

  const handleAddProjectComment = async event => {

    event.preventDefault();

    if (savingCommentRef.current) return;

    setCommentError('');

    if (
      !selectedProject ||
      !canAccessProject(
        currentUser,
        selectedProject,
        teamMembers
      )
    ) {
      setCommentError(
        'You cannot access this project.'
      );

      return;
    }

    const message =
      projectCommentText.trim();

    if (!message) {
      setCommentError(
        'Enter a project update.'
      );

      return;
    }

    if (
      message.length > MAX_COMMENT_LENGTH
    ) {
      setCommentError(
        `Updates cannot exceed ${MAX_COMMENT_LENGTH} characters.`
      );

      return;
    }

    savingCommentRef.current = true;

    setIsSavingProjectComment(true);

    try {

      const updated =
        await addProjectComment(
          selectedProject.id,
          message
        );

      if (!updated?.id) {
        throw new Error(
          'Project update could not be confirmed.'
        );
      }

      setProjectCommentText('');

      triggerToast(
        'Project update posted.',
        'good'
      );

    } catch (error) {

      const message =
        error.message ||
        'Project update could not be posted.';

      setCommentError(message);

      triggerToast(
        message,
        'error'
      );

    } finally {

      savingCommentRef.current = false;

      setIsSavingProjectComment(false);

    }
  };


// ============================================================
// MAIN UI
// ============================================================

  return (

    <div className="relative space-y-4">

      {/* PROJECT TOOLBAR */}

      <section className="glass-card !p-4 !flex !flex-row !flex-wrap !items-end !justify-between !gap-3">

        <label className="w-full min-w-0 space-y-2 sm:max-w-md sm:flex-1">

          <span className="block text-xs font-semibold text-muted">
            Search Projects
          </span>

          <div className="relative">

            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"/>

            <input
              type="search"
              value={searchTerm}
              placeholder="Search by project name, code or department"
              onChange={event =>
                setSearchTerm(event.target.value)
              }
              className="h-11 w-full rounded-xl border border-line bg-surface2 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
            />

          </div>

        </label>

        <div className="flex w-full flex-wrap items-end gap-3 sm:ml-auto sm:w-auto">

          <label className="min-w-[150px] flex-1 space-y-2 sm:w-44 sm:flex-none">

            <span className="block text-xs font-semibold text-muted">
              Project Status
            </span>

            <div className="relative">

              <select
                value={selectedStatus}
                onChange={event =>
                  setSelectedStatus(event.target.value)
                }
                className="h-11 w-full appearance-none rounded-xl border border-line bg-surface2 pl-3 pr-9 text-sm text-ink outline-none focus:border-accent"
              >

                <option value="All">
                  All Statuses
                </option>

                {PROJECT_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}

              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"/>

            </div>

          </label>

          {canManage && (

            <button
              type="button"
              onClick={openCreateProjectModal}
              className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-accent px-4 text-sm font-semibold text-on-accent hover:brightness-105"
            >

              <Plus className="h-4 w-4"/>

              New Project

            </button>

          )}

        </div>

      </section>
{/* PROJECT CARDS */}

      <div className="flex items-center justify-between gap-3 px-1">

        <span className="text-sm font-semibold text-ink">
          All Projects
        </span>

        <span className="text-xs text-muted">
          {filteredProjects.length} of {authorizedProjects.length} projects
        </span>

      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">

        {!filteredProjects.length ? (

          <div className="glass-card col-span-full !p-10 text-center text-sm text-muted">

            {authorizedProjects.length
              ? 'No projects match the selected filters.'
              : 'No projects are assigned to your authorized team yet.'}

          </div>

        ) : (

          filteredProjects.map(project => {

            const relatedTasks = tasks.filter(task =>
              sameId(task.projectId, project.id)
            );

            const doneCount =
              relatedTasks.filter(isCompletedTask).length;

            const cardProgress =
              calculateProgress(project, relatedTasks);

            const visibleMemberCount = new Set(
              (project.memberIds || [])
                .map(String)
                .filter(id => authorizedMemberIds.has(id))
            ).size;

            return (

              <button
                type="button"
                key={project.id}
                onClick={() => openProjectDetails(project)}
                className="glass-card group !flex !h-full !min-w-0 !flex-col !items-stretch !justify-start !gap-4 !p-5 text-left transition hover:border-accent/50"
              >

                <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2 text-xs">

                      <span className="rounded-md border border-accent/20 bg-accent/10 px-2 py-1 font-semibold text-accent">
                        {project.projectCode || project.id}
                      </span>

                      <span className="text-muted">
                        {project.department}
                      </span>

                    </div>

                    <h3 className="mt-3 break-words text-lg font-semibold leading-snug text-ink group-hover:text-accent">

                      {project.name}

                    </h3>

                  </div>

                  <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${statusTone(project.status)}`}>

                    <span className="h-1.5 w-1.5 rounded-full bg-current"/>

                    {project.status || 'Not Specified'}

                  </span>

                </div>

                <p className="min-h-[40px] line-clamp-2 break-words text-sm leading-relaxed text-muted">

                  {project.description || 'No project description provided.'}

                </p>

                <div className="flex flex-wrap items-center gap-2">

                  {project.priority && (

                    <span className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${priorityTone(project.priority)}`}>

                      {project.priority} Priority

                    </span>

                  )}

                  {project.health && (

                    <span className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${healthTone(project.health)}`}>

                      {project.health}

                    </span>

                  )}

                </div>

                <div className="mt-auto space-y-2">

                  <div className="flex items-center justify-between gap-2">

                    <span className="text-xs font-medium text-muted">
                      Project Completion
                    </span>

                    <span className="text-sm font-bold text-ink tabular-nums">
                      {cardProgress}%
                    </span>

                  </div>

                  <div
                    role="progressbar"
                    aria-label="Project completion"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={cardProgress}
                    className="h-2 overflow-hidden rounded-full bg-surface2"
                  >

                    <div
                      style={{ width: `${cardProgress}%` }}
                      className={`h-full rounded-full transition-all ${
                        cardProgress === 100
                          ? 'bg-good'
                          : 'bg-accent'
                      }`}
                    />

                  </div>

                </div>

                <div className="grid grid-cols-2 gap-3 rounded-xl border border-line/50 bg-surface2/30 p-3">

                  <div className="min-w-0">

                    <div className="flex items-center gap-1.5 text-xs text-muted">

                      <Users className="h-3.5 w-3.5 shrink-0"/>

                      Team Members

                    </div>

                    <div className="mt-1 text-sm font-semibold text-ink">

                      {visibleMemberCount}

                    </div>

                  </div>

                  <div className="min-w-0 border-l border-line/50 pl-3">

                    <div className="flex items-center gap-1.5 text-xs text-muted">

                      <ListTodo className="h-3.5 w-3.5 shrink-0"/>

                      Tasks Completed

                    </div>

                    <div className="mt-1 text-sm font-semibold text-ink">

                      {doneCount} / {relatedTasks.length}

                    </div>

                  </div>

                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-3">

                  <span className="flex items-center gap-1.5 text-xs text-muted">

                    <CalendarDays className="h-4 w-4 shrink-0"/>

                    Due {project.dueDate
                      ? formatDate(project.dueDate)
                      : 'Not scheduled'}

                  </span>

                  <span className="text-xs font-semibold text-accent">

                    View Details

                  </span>

                </div>

              </button>

            );

          })

        )}

      </div>
{/* CREATE PROJECT MODAL */}

      {isModalOpen && canManage && (

        <ModalPortal
          onClose={closeCreateProjectModal}
          ariaLabelledby="create-project-title"
        >

          <div className="relative max-h-[90vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-2xl border !border-[#34515b] !bg-[#142c37] p-5 text-white shadow-2xl">

            <button
              type="button"
              onClick={closeCreateProjectModal}
              disabled={isSavingProject}

              className="absolute right-4 top-4 rounded-full p-2 text-muted hover:bg-surface2 hover:text-ink disabled:opacity-50"

              aria-label="Close"
            >

              <X className="h-4 w-4" />

            </button>

            <div className="border-b border-line/60 pb-3 pr-8">

              <h3
                id="create-project-title"
                className="font-display text-lg font-bold text-ink"
              >

                {editingProjectId
                  ? 'Edit Project'
                  : 'Create New Project'}

              </h3>

              <p className="mt-1 text-xs text-muted">

                Assign project access only to your authorized team members.

              </p>

            </div>


            <form onSubmit={handleCreateProject}>

              <fieldset
                disabled={isSavingProject}
                className="grid min-w-0 gap-3 text-xs sm:grid-cols-2"
              >

                {/* PROJECT NAME */}

                <label className="space-y-1 sm:col-span-2">

                  <span className="font-semibold text-muted">

                    Project Name *

                  </span>

                  <input
                    required
                    maxLength={120}
                    value={newProject.name}

                    onChange={event =>
                      setNewProject({
                        ...newProject,
                        name: event.target.value
                      })
                    }

                    placeholder="e.g. HRMS Portal Revamp"

                    className="w-full rounded-xl border border-line bg-surface2 px-3 py-2 text-ink"
                  />

                </label>


                {/* PROJECT CODE */}

                <label className="space-y-1">

                  <span className="font-semibold text-muted">

                    Project Code *

                  </span>

                  <input
                    required
                    maxLength={40}
                    value={newProject.projectCode}

                    onChange={event =>
                      setNewProject({
                        ...newProject,

                        projectCode:
                          event.target.value.toUpperCase()
                      })
                    }

                    placeholder="e.g. HRMS-REVAMP"

                    className="w-full rounded-xl border border-line bg-surface2 px-3 py-2 text-ink"
                  />

                </label>


                {/* DEPARTMENT */}

                <label className="space-y-1">

                  <span className="font-semibold text-muted">

                    Client / Department *

                  </span>

                  <input
                    required
                    maxLength={100}
                    value={newProject.department}

                    onChange={event =>
                      setNewProject({
                        ...newProject,

                        department:
                          event.target.value
                      })
                    }

                    placeholder="Client or department"

                    className="w-full rounded-xl border border-line bg-surface2 px-3 py-2 text-ink"
                  />

                </label>


                {/* DESCRIPTION */}

                <label className="space-y-1 sm:col-span-2">

                  <span className="font-semibold text-muted">

                    Description *

                  </span>

                  <textarea
                    required
                    rows={3}
                    maxLength={1000}
                    value={newProject.description}

                    onChange={event =>
                      setNewProject({
                        ...newProject,

                        description:
                          event.target.value
                      })
                    }

                    placeholder="Describe the project scope and outcomes"

                    className="w-full rounded-xl border border-line bg-surface2 px-3 py-2 text-ink"
                  />

                  <span className="block text-right text-[10px] text-muted">

                    {newProject.description.length}/1000

                  </span>

                </label>


                {/* START DATE */}

                <label className="space-y-1">

                  <span className="font-semibold text-muted">

                    Start Date *

                  </span>

                  <input
                    required
                    type="date"

                    value={newProject.startDate}

                    onChange={event =>
                      setNewProject({
                        ...newProject,

                        startDate:
                          event.target.value
                      })
                    }

                    className="w-full rounded-xl border border-line bg-surface2 px-3 py-2 text-ink"
                  />

                </label>


                {/* DEADLINE */}

                <label className="space-y-1">

                  <span className="font-semibold text-muted">

                    Deadline *

                  </span>

                  <input
                    required
                    type="date"

                    value={newProject.dueDate}

                    min={
                      newProject.startDate ||
                      undefined
                    }

                    onChange={event =>
                      setNewProject({
                        ...newProject,

                        dueDate:
                          event.target.value
                      })
                    }

                    className="w-full rounded-xl border border-line bg-surface2 px-3 py-2 text-ink"
                  />

                </label>


                {/* PRIORITY */}

                <label className="space-y-1">

                  <span className="font-semibold text-muted">

                    Priority

                  </span>

                  <select
                    value={newProject.priority}

                    onChange={event =>
                      setNewProject({
                        ...newProject,

                        priority:
                          event.target.value
                      })
                    }

                    className="w-full rounded-xl border border-line bg-[#141824] px-3 py-2 text-white"
                  >

                    {PROJECT_PRIORITIES.map(priority => (

                      <option
                        key={priority}
                        value={priority}
                      >

                        {priority}

                      </option>

                    ))}

                  </select>

                </label>


                {/* STATUS */}

                <label className="space-y-1">

                  <span className="font-semibold text-muted">

                    Status

                  </span>

                  <select
                    value={newProject.status}

                    onChange={event =>
                      setNewProject({
                        ...newProject,

                        status:
                          event.target.value
                      })
                    }

                    className="w-full rounded-xl border border-line bg-[#141824] px-3 py-2 text-white"
                  >

                    {PROJECT_STATUSES.map(status => (

                      <option
                        key={status}
                        value={status}
                      >

                        {status}

                      </option>

                    ))}

                  </select>

                </label>


                {/* TEAM MEMBERS */}

                <label className="space-y-1 sm:col-span-2">

                  <span className="font-semibold text-muted">

                    Assign Team Members

                  </span>

                  <select
                    multiple
                    disabled={hasRestrictedMembers}
                    value={newProject.memberIds}

                    onChange={selectMembers}

                    className="min-h-28 w-full rounded-xl border border-line bg-[#141824] px-3 py-2 text-white"

                    aria-describedby="team-member-hint"
                  >

                    {teamMembers
                      .filter(member =>
                        Boolean(getMemberId(member))
                      )
                      .map(member => (

                        <option
                          key={getMemberId(member)}
                          value={getMemberId(member)}
                        >

                          {member.name}

                          {' · '}

                          {getMemberId(member)}

                          {' · '}

                          {member.designation}

                        </option>

                      ))}

                  </select>

                  <span
                    id="team-member-hint"
                    className="block text-[10px] text-muted"
                  >
                    {hasRestrictedMembers && (
                      <span className="block mb-2">
                        Some project members are outside
                        your access scope. Existing
                        assignments will be preserved.
                      </span>
                    )}

                    Hold Ctrl (Windows) or Command (Mac) to select multiple people.

                    {' '}

                    Only authorized team members are listed.

                  </span>

                  <span className="block text-[11px] text-accent font-semibold">

                    {newProject.memberIds.length}

                    {' '}members selected

                  </span>

                  {!teamMembers.length && (

                    <span className="block text-xs text-warn">

                      No authorized team members available.

                    </span>

                  )}

                </label>


                {/* MEMBER ROLES */}

                {newProject.memberIds.length > 0 && (

                  <div className="space-y-2 sm:col-span-2">

                    <span className="font-semibold text-muted">

                      Project Role for Each Member

                    </span>

                    {newProject.memberIds.map(memberId => {

                      const member =
                        findTeamMember(memberId);

                      if (!member) return null;

                      return (

                        <label
                          key={memberId}
                          className="flex flex-col gap-2 rounded-xl border border-line/50 bg-surface2/50 p-3 sm:flex-row sm:items-center"
                        >

                          <span className="min-w-0 flex-1 text-xs text-ink">

                            <span className="block font-semibold">

                              {member.name}

                            </span>

                            <span className="text-[10px] text-muted">

                              {memberId}

                              {' · '}

                              {member.designation}

                            </span>

                          </span>

                          <input
                            required
                            disabled={hasRestrictedMembers}
                            maxLength={60}

                            value={
                              newProject.memberRoles[
                                memberId
                              ] || ''
                            }

                            onChange={event =>
                              setNewProject(current => ({

                                ...current,

                                memberRoles: {

                                  ...current.memberRoles,

                                  [memberId]:
                                    event.target.value

                                }

                              }))
                            }

                            placeholder="Project role"

                            aria-label={`Project role for ${member.name}`}

                            className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink sm:w-56"
                          />

                        </label>

                      );
                    })}

                  </div>

                )}

              </fieldset>


              {/* PROJECT VALIDATION ERROR */}

              {projectError && (

                <div
                  role="alert"
                  className="mt-3 rounded-xl border border-bad/30 bg-bad/10 p-3 text-xs text-bad"
                >

                  {projectError}

                </div>

              )}


              {/* FORM ACTIONS */}

              <div className="flex justify-end gap-2 border-t border-line pt-3 mt-4">

                <button
                  type="button"
                  onClick={closeCreateProjectModal}
                  disabled={isSavingProject}

                  className="rounded-xl border border-line bg-surface2 px-4 py-2 text-xs font-semibold text-ink disabled:opacity-50"
                >

                  Cancel

                </button>

                <button
                  type="submit"
                  disabled={isSavingProject}

                  className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-on-accent disabled:opacity-50"
                >

                  {isSavingProject
                    ? 'Saving Project...'
                    : editingProjectId
                      ? 'Update Project'
                      : 'Save Project'}

                </button>

              </div>

            </form>

          </div>

        </ModalPortal>

      )}


      {/* PROJECT DETAILS MODAL */}

      {selectedProject && !isModalOpen && (

        <ModalPortal

          onClose={closeProjectDetails}

          closeOnBackdrop

          ariaLabelledby="project-detail-title"

          className={`p-3 sm:p-5 transition-opacity duration-150 ${
            isClosingDetails
              ? 'opacity-0'
              : 'opacity-100'
          }`}
        >

          <div className={`relative max-h-[90vh] w-full max-w-5xl space-y-5 overflow-y-auto rounded-2xl border border-[#34515b] bg-[#142c37] p-5 text-white shadow-2xl transition-all duration-150 sm:p-6 ${
            isClosingDetails
              ? 'translate-y-2 opacity-0'
              : 'translate-y-0 opacity-100'
          }`}>

            <button
              type="button"

              onClick={closeProjectDetails}

              disabled={
                isSavingTask ||
                isSavingProjectComment
              }

              className="absolute right-4 top-4 rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"

              aria-label="Close project details"
            >

              <X className="h-4 w-4" />

            </button>


            {/* DETAILS HEADER */}

            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4 pr-10">

              <div className="min-w-0">

                <button
                  type="button"

                  onClick={closeProjectDetails}

                  disabled={
                    isSavingTask ||
                    isSavingProjectComment
                  }

                  className="mb-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 active:scale-95"

                  aria-label="Back to Projects"
                >

                  <ArrowLeft className="h-4 w-4" />

                  Back

                </button>

                <div className="mb-1 block w-fit rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">

                  {selectedProject.projectCode ||
                    selectedProject.id}

                </div>

                <h2
                  id="project-detail-title"
                  className="font-display text-xl font-bold text-white sm:text-2xl"
                >

                  {selectedProject.name}

                </h2>

              </div>

              <div className="flex flex-wrap gap-2">

                {canEditSelectedProject && (
                  <button
                    type="button"
                    onClick={openEditProjectModal}
                    disabled={
                      isSavingTask ||
                      isSavingProjectComment ||
                      isSavingMilestone
                    }
                    className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-on-accent disabled:opacity-50"
                  >
                    Edit Project
                  </button>
                )}

                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(selectedProject.status)}`}>

                  {selectedProject.status}

                </span>

                {selectedProject.health && (

                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${healthTone(selectedProject.health)}`}>

                    {selectedProject.health}

                  </span>

                )}

                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityTone(selectedProject.priority)}`}>

                  {selectedProject.priority} Priority

                </span>

              </div>

            </div>


            {/* PROJECT DETAILS CONTENT */}

            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">

              <div className="space-y-5">

                {/* PROJECT INFORMATION */}

                <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:col-span-2">

                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">

                      Description & Objectives

                    </span>

                    <p className="mt-1.5 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-200">

                      {selectedProject.description ||
                        'No project description provided.'}

                    </p>

                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">

                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">

                      Start Date

                    </span>

                    <div className="mt-1 text-xs font-semibold text-white">

                      {formatDate(
                        selectedProject.startDate
                      )}

                    </div>

                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">

                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">

                      Target Deadline

                    </span>

                    <div className="mt-1 text-xs font-semibold text-white">

                      {formatDate(
                        selectedProject.dueDate
                      )}

                    </div>

                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">

                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">

                      Client / Department

                    </span>

                    <div className="mt-1 text-xs font-semibold text-white">

                      {selectedProject.department}

                    </div>

                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">

                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">

                      Project Tasks

                    </span>

                    <div className="mt-1 text-xs font-semibold text-white">

                      {completedTaskCount}

                      {' '}of{' '}

                      {projectTasks.length}

                      {' '}complete

                    </div>

                    <div className="mt-1 text-[10px] text-slate-400">

                      {selectedProject.activeSprint?.name ||
                        'Sprint not assigned'}

                      {selectedProject.activeSprint?.status &&
                        ` · ${selectedProject.activeSprint.status}`}

                    </div>

                  </div>

                </section>


                {/* OVERALL COMPLETION */}

                <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4 space-y-2">

                  <div className="flex items-center justify-between text-xs">

                    <span className="font-semibold text-ink">

                      Overall Completion

                    </span>

                    <span className="font-bold text-accent">

                      {progress}%

                    </span>

                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-surface2">

                    <div
                      style={{
                        width: `${progress}%`
                      }}

                      className={`h-full rounded-full transition-all ${
                        progress === 100
                          ? 'bg-good'
                          : 'bg-accent'
                      }`}
                    />

                  </div>

                </section>


                {/* PROJECT TASKS */}

                <section className="glass-card !p-4 !gap-3">

                  <div className="flex items-center justify-between">

                    <h3 className="flex items-center gap-2 text-sm font-bold text-ink">

                      <ListTodo className="h-4 w-4 text-accent" />

                      Project Tasks

                    </h3>

                    <span className="text-[10px] text-muted">

                      {projectTasks.length} total

                    </span>

                  </div>


                  {projectTasks.length ? (

                    <div className="space-y-2">

                      {projectTasks.map(task => {

                        const assignee =
                          findTeamMember(
                            task.assigneeId
                          );

                        return (

                          <div
                            key={task.id}

                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line/50 bg-surface2/40 p-3"
                          >

                            <div className="min-w-0">

                              <div className="text-xs font-semibold text-ink break-words">

                                {task.title}

                              </div>

                              <div className="mt-1 text-[10px] text-muted">

                                {assignee?.name ||
                                  task.assigneeName ||
                                  'Team member'}

                                {' · Due '}

                                {formatDate(task.dueDate)}

                              </div>

                            </div>

                            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                              isCompletedTask(task)
                                ? 'bg-good/10 text-good'
                                : task.status === 'In Progress'
                                  ? 'bg-info/10 text-info'
                                  : 'bg-surface text-muted'
                            }`}>

                              {isCompletedTask(task)
                                ? 'Done'
                                : task.status}

                            </span>

                          </div>

                        );
                      })}

                    </div>

                  ) : (

                    <p className="text-xs text-muted">

                      No tasks are linked to this project yet.

                    </p>

                  )}


                  {/* ADD TASK FORM */}

                  {canAssign &&
                    selectedProject.status !== 'Completed' && (

                    <form
                      onSubmit={handleAddTask}
                      className="border-t border-line/60 pt-3"
                    >

                      {assignableMembers.length ? (

                        <fieldset
                          disabled={isSavingTask}
                          className="grid min-w-0 gap-2 sm:grid-cols-2"
                        >

                          <input
                            required
                            maxLength={150}
                            value={taskForm.title}

                            onChange={event =>
                              setTaskForm({
                                ...taskForm,

                                title:
                                  event.target.value
                              })
                            }

                            placeholder="New task title"

                            className="rounded-xl border border-line bg-surface2 px-3 py-2 text-xs text-ink sm:col-span-2"

                            aria-label="Task title"
                          />

                          <select
                            required
                            value={taskForm.assigneeId}

                            onChange={event =>
                              setTaskForm({
                                ...taskForm,

                                assigneeId:
                                  event.target.value
                              })
                            }

                            className="rounded-xl border border-line bg-[#141824] px-3 py-2 text-xs text-white"

                            aria-label="Assign task to"
                          >

                            <option value="">

                              Assign team member

                            </option>

                            {assignableMembers.map(member => (

                              <option
                                key={getMemberId(member)}
                                value={getMemberId(member)}
                              >

                                {member.name}

                              </option>

                            ))}

                          </select>

                          <input
                            required
                            type="date"

                            value={taskForm.dueDate}

                            min={minimumTaskDate}

                            max={
                              selectedProject.dueDate ||
                              undefined
                            }

                            onChange={event =>
                              setTaskForm({
                                ...taskForm,

                                dueDate:
                                  event.target.value
                              })
                            }

                            className="rounded-xl border border-line bg-surface2 px-3 py-2 text-xs text-ink"

                            aria-label="Task due date"
                          />

                          <select
                            value={taskForm.status}

                            onChange={event =>
                              setTaskForm({
                                ...taskForm,

                                status:
                                  event.target.value
                              })
                            }

                            className="rounded-xl border border-line bg-[#141824] px-3 py-2 text-xs text-white"

                            aria-label="Task status"
                          >

                            {TASK_STATUSES.map(status => (

                              <option
                                key={status}
                                value={status}
                              >

                                {status}

                              </option>

                            ))}

                          </select>

                          <button
                            disabled={isSavingTask}
                            type="submit"

                            className="inline-flex items-center justify-center gap-1 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-on-accent disabled:opacity-50"
                          >

                            <Plus className="h-3.5 w-3.5" />

                            {isSavingTask
                              ? 'Adding...'
                              : 'Add Task'}

                          </button>

                        </fieldset>

                      ) : (

                        <p className="text-xs text-warn">

                          No authorized project members are available for task assignment.

                        </p>

                      )}

                      {taskError && (

                        <p
                          role="alert"
                          className="mt-2 text-xs text-bad"
                        >

                          {taskError}

                        </p>

                      )}

                    </form>

                  )}


                  {selectedProject.status === 'Completed' && (

                    <p className="text-xs text-good border-t border-line/60 pt-3">

                      This project is completed. New task assignments are disabled.

                    </p>

                  )}

                </section>


                {/* PROJECT MILESTONES */}

                <section className="glass-card !p-4 !gap-3">

                  <div className="flex items-center justify-between gap-2">

                    <h3 className="flex items-center gap-2 text-sm font-bold text-ink">

                      <CheckCircle2 className="h-4 w-4 text-accent" />

                      Project Milestones

                    </h3>

                    <span className="text-xs text-muted">

                      {(selectedProject.milestones || [])
                        .filter(item => item.done).length}

                      /

                      {(selectedProject.milestones || []).length}

                      {' '}complete

                    </span>

                  </div>

                  {(selectedProject.milestones || []).length > 0 && (

                    <div className="h-2 overflow-hidden rounded-full bg-surface2">

                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{
                          width: `${
                            (
                              selectedProject.milestones.filter(
                                item => item.done
                              ).length /
                              selectedProject.milestones.length
                            ) * 100
                          }%`
                        }}
                      />

                    </div>

                  )}

                  {(selectedProject.milestones || []).length ? (

                    <div className="space-y-2">

                      {selectedProject.milestones.map(item => (

                        <label
                          key={item.id}
                          className="flex items-center gap-3 rounded-xl border border-line/50 bg-surface2/40 p-3"
                        >

                          <input
                            type="checkbox"

                            checked={Boolean(item.done)}

                            disabled={
                              !canEditSelectedProject ||
                              isSavingMilestone ||
                              selectedProject.status === 'Completed'
                            }

                            onChange={() =>
                              handleMilestoneChange(item)
                            }

                            className="h-4 w-4 accent-teal-400"
                          />

                          <span className={`flex-1 break-words text-xs ${
                            item.done
                              ? 'text-good line-through'
                              : 'text-ink'
                          }`}>

                            {item.title ||
                              item.name ||
                              'Milestone'}

                          </span>

                          <span className={`text-[10px] ${
                            item.done
                              ? 'text-good'
                              : 'text-muted'
                          }`}>

                            {item.done
                              ? 'Completed'
                              : 'Pending'}

                          </span>

                        </label>

                      ))}

                    </div>

                  ) : (

                    <p className="text-xs text-muted">

                      No milestones added yet.

                    </p>

                  )}

                  {canEditSelectedProject &&
                   selectedProject.status !== 'Completed' && (

                    <form
                      onSubmit={event => {
                        event.preventDefault();
                        handleMilestoneChange();
                      }}
                      className="flex flex-wrap gap-2 border-t border-line/50 pt-3"
                    >

                      <input
                        required
                        maxLength={120}

                        value={milestoneTitle}

                        disabled={isSavingMilestone}

                        onChange={event => {
                          setMilestoneTitle(
                            event.target.value
                          );

                          setMilestoneError('');
                        }}

                        placeholder="Enter milestone title"

                        aria-label="Milestone title"

                        className="min-w-0 flex-1 rounded-xl border border-line bg-surface2 px-3 py-2 text-xs text-ink"
                      />

                      <button
                        type="submit"

                        disabled={
                          isSavingMilestone ||
                          !milestoneTitle.trim()
                        }

                        className="rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-on-accent disabled:opacity-50"
                      >

                        {isSavingMilestone
                          ? 'Saving...'
                          : 'Add Milestone'}

                      </button>

                    </form>

                  )}

                  {milestoneError && (

                    <p
                      role="alert"
                      className="text-xs text-bad"
                    >

                      {milestoneError}

                    </p>

                  )}

                </section>

                {/* PROJECT UPDATES */}

                <section className="glass-card !p-4 !gap-3">

                  <div className="flex items-center justify-between">

                    <h3 className="flex items-center gap-2 text-sm font-bold text-ink">

                      <MessageSquare className="h-4 w-4 text-accent" />

                      Project Updates

                    </h3>

                    <span className="text-[10px] text-muted">

                      {selectedProject.comments?.length || 0}

                      {' '}updates

                    </span>

                  </div>


                  {selectedProject.comments?.length ? (

                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">

                      {[...selectedProject.comments]
                        .sort((first, second) =>
                          new Date(second.timestamp) -
                          new Date(first.timestamp)
                        )
                        .map((comment, index) => (

                          <article
                            key={
                              comment.id ||
                              `${selectedProject.id}-${index}`
                            }

                            className="rounded-xl border border-line/50 bg-surface2/40 p-3"
                          >

                            <div className="flex flex-wrap items-start justify-between gap-2">

                              <div>

                                <div className="text-xs font-semibold text-ink">

                                  {comment.authorName}

                                </div>

                                <div className="mt-0.5 text-[10px] text-accent">

                                  {comment.role}

                                </div>

                              </div>

                              <time
                                className="text-[10px] text-muted"
                                dateTime={comment.timestamp}
                              >

                                {comment.timestamp
                                  ? new Date(
                                      comment.timestamp
                                    ).toLocaleString()
                                  : 'Date unavailable'}

                              </time>

                            </div>

                            <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-muted">

                              {comment.message}

                            </p>

                          </article>

                        ))}

                    </div>

                  ) : (

                    <p className="text-xs text-muted">

                      No project updates have been posted yet.

                    </p>

                  )}


                  {/* POST UPDATE FORM */}

                  <form
                    onSubmit={handleAddProjectComment}
                    className="flex flex-col gap-2 border-t border-line/60 pt-3"
                  >

                    <textarea
                      rows={2}

                      maxLength={MAX_COMMENT_LENGTH}

                      value={projectCommentText}

                      disabled={isSavingProjectComment}

                      onChange={event => {

                        setProjectCommentText(
                          event.target.value
                        );

                        setCommentError('');

                      }}

                      placeholder="Share a project update..."

                      aria-label="Project update"

                      className="w-full rounded-xl border border-line bg-surface2 px-3 py-2 text-xs text-ink"
                    />

                    <div className="flex items-center justify-between gap-2">

                      <span className="text-[10px] text-muted">

                        {projectCommentText.length}

                        /{MAX_COMMENT_LENGTH}

                      </span>

                      <button

                        disabled={
                          isSavingProjectComment ||
                          !projectCommentText.trim()
                        }

                        type="submit"

                        className="inline-flex items-center justify-center gap-1 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-on-accent disabled:opacity-50"
                      >

                        <Send className="h-3.5 w-3.5" />

                        {isSavingProjectComment
                          ? 'Posting...'
                          : 'Post Update'}

                      </button>

                    </div>

                    {commentError && (

                      <p
                        role="alert"
                        className="text-xs text-bad"
                      >

                        {commentError}

                      </p>

                    )}

                  </form>

                </section>

              </div>


              {/* PROJECT TEAM */}

              <aside className="glass-card !p-4 !gap-3 min-w-0 self-start">

                <h3 className="flex items-center gap-2 text-sm font-bold text-ink">

                  <Users className="h-4 w-4 text-accent" />

                  Project Team

                  <span className="ml-auto text-[10px] font-medium text-muted">

                    {assignedMembers.length}

                  </span>

                </h3>


                {assignedMembers.length ? (

                  <div className="space-y-2">

                    {assignedMembers.map(member => {

                      const memberId =
                        getMemberId(member);

                      const count =
                        projectTasks.filter(task =>
                          sameId(
                            task.assigneeId,
                            memberId
                          )
                        ).length;

                      const projectRole =
                        selectedProject.memberRoles?.[
                          memberId
                        ] ||
                        member.designation ||
                        'Team Member';

                      return (

                        <div
                          key={memberId}

                          className="rounded-xl border border-line/50 bg-surface2/40 p-3"
                        >

                          <div className="flex items-start gap-2.5">

                            <Avatar
                              name={member.name}
                              size="sm"
                            />

                            <div className="min-w-0 flex-1">

                              <div className="truncate text-xs font-semibold text-ink">

                                {member.name}

                              </div>

                              <div className="truncate text-[10px] text-muted">

                                {memberId}

                                {' · '}

                                {member.dept ||
                                  member.department ||
                                  'Department not listed'}

                              </div>

                            </div>

                            <span className="max-w-[9rem] rounded-full bg-accent/10 px-2 py-1 text-right text-[10px] font-semibold text-accent break-words">

                              {projectRole}

                            </span>

                          </div>


                          <div className="mt-2 space-y-1 border-t border-line/50 pt-2 text-[10px] text-muted">

                            <div>

                              Job title:{' '}

                              {member.designation ||
                                'Not listed'}

                            </div>

                            <div className="break-all">

                              Email:{' '}

                              {member.email ||
                                'Not listed'}

                            </div>

                            <div>

                              Phone:{' '}

                              {member.phone ||
                                'Not listed'}

                            </div>

                            <div className="pt-1 font-medium text-ink">

                              {count} project task

                              {count === 1 ? '' : 's'}

                            </div>

                          </div>

                        </div>

                      );
                    })}

                  </div>

                ) : (

                  <p className="text-xs text-muted">

                    No authorized team members are assigned.

                  </p>

                )}


                {/* SPRINT INFORMATION */}

                <div className="flex items-center gap-2 border-t border-line/60 pt-3 text-xs text-muted">

                  <Clock3 className="h-4 w-4 text-accent" />

                  {selectedProject.activeSprint?.name ||
                    'Sprint not assigned'}

                  {selectedProject.activeSprint?.status &&
                    ` · ${selectedProject.activeSprint.status}`}

                </div>


                {/* TASK COMPLETION */}

                <div className="flex items-center gap-2 text-xs text-muted">

                  <CheckCircle2 className="h-4 w-4 text-good" />

                  {completedTaskCount}

                  {' '}of{' '}

                  {projectTasks.length}

                  {' '}tasks complete

                </div>

              </aside>

            </div>

          </div>

        </ModalPortal>

      )}

    </div>

  );

};

export default Projects;