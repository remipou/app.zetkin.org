import { CallAssignmentData } from 'features/callAssignments/apiTypes';
import CallAssignmentsRepo from 'features/callAssignments/repos/CallAssignmentsRepo';
import Environment from 'core/env/Environment';
import { isInFuture } from 'utils/dateUtils';
import { ModelBase } from 'core/models';
import SurveysRepo from 'features/surveys/repos/SurveysRepo';
import TasksRepo from 'features/tasks/repos/TasksRepo';
import { IFuture, LoadingFuture, ResolvedFuture } from 'core/caching/futures';
import { ZetkinCallAssignment, ZetkinSurveyExtended, ZetkinTask } from 'utils/types/zetkin';

export enum ACTIVITIES {
  CALL_ASSIGNMENT = 'callAssignment',
  SURVEY = 'survey',
  TASK = 'task',
}

export type CampaignActivity =
  | (ZetkinSurveyExtended & { kind: ACTIVITIES.SURVEY })
  | (ZetkinCallAssignment & { kind: ACTIVITIES.CALL_ASSIGNMENT })
  | (ZetkinTask & { kind: ACTIVITIES.TASK });

export default class CampaignActivitiesModel extends ModelBase {
  private _callAssignmentsRepo: CallAssignmentsRepo;
  private _orgId: number;
  private _surveysRepo: SurveysRepo;
  private _tasksRepo: TasksRepo;

  constructor(env: Environment, orgId: number) {
    super();
    this._orgId = orgId;
    this._callAssignmentsRepo = new CallAssignmentsRepo(env);
    this._surveysRepo = new SurveysRepo(env);
    this._tasksRepo = new TasksRepo(env);
  }

  getCampaignActivities(campId: number): IFuture<CampaignActivity[]> {
    const activities = this.getCurrentActivities().data;
    const filtered = activities?.filter(
      (activity) => activity.campaign?.id === campId
    );
    return new ResolvedFuture(filtered || []);
  }

  getCurrentActivities(): IFuture<CampaignActivity[]> {
    const callAssignmentsFuture = this._callAssignmentsRepo.getCallAssignments(
      this._orgId
    );
    const surveysFuture = this._surveysRepo.getSurveys(this._orgId);
    const tasksFuture = this._tasksRepo.getTasks(this._orgId);

    if (
      !callAssignmentsFuture.data ||
      !surveysFuture.data ||
      !tasksFuture.data
    ) {
      return new LoadingFuture();
    }

    const callAssignments: CampaignActivity[] = callAssignmentsFuture.data
      .filter((ca) => !ca.end_date || isInFuture(ca.end_date))
      .map((ca) => ({
        ...ca,
        kind: ACTIVITIES.CALL_ASSIGNMENT,
      }));

    const surveys: CampaignActivity[] = surveysFuture.data
      .filter((survey) => !survey.expires || isInFuture(survey.expires))
      .map((survey) => ({
        ...survey,
        kind: ACTIVITIES.SURVEY,
      }));

    const tasks: CampaignActivity[] = tasksFuture.data
      .filter((task) => !task.expires || isInFuture(task.expires))
      .map((task) => ({
        ...task,
        kind: ACTIVITIES.TASK,
      }));

    const unsorted = callAssignments.concat(...surveys, ...tasks);

    const sorted = unsorted.sort((first, second) => {
      const firstStartDate = getStartDate(first);
      const secondStartDate = getStartDate(second);

      if (firstStartDate === null) {
        return -1;
      } else if (secondStartDate === null) {
        return 1;
      }

      return secondStartDate.getTime() - firstStartDate.getTime();
    });

    return new ResolvedFuture(sorted);
  }

  getStandaloneActivities(): IFuture<CampaignActivity[]> {
    const activities = this.getCurrentActivities().data;
    const filtered = activities?.filter(
      (activity) => activity.campaign === null
    );
    return new ResolvedFuture(filtered || []);
  }
}

function getStartDate(activity: CampaignActivity): Date | null {
  if (activity.kind === ACTIVITIES.SURVEY) {
    if (!activity.published) {
      return null;
    }
    return new Date(activity.published);
  } else if (activity.kind === ACTIVITIES.CALL_ASSIGNMENT) {
    if (!activity.start_date) {
      return null;
    }
    return new Date(activity.start_date);
  } else {
    if (!activity.published) {
      return null;
    }
    return new Date(activity.published);
  }
}
