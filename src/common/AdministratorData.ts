export class CreativeTool 
{
    Team     : string
	ToolName : string
	Type     : string
    Point: number[]
    
    constructor(
        team: string,
        toolName: string,
        type: string,
        point: number[]
    )
    {
        this.Team = team;
        this.ToolName = toolName;
        this.Type = type;
        this.Point = point;
    }
}

export class Level 
{
    Team: string
    LevelPoint: number[]
    
    constructor(
        team: string,
        levelPoint: number[]
    )
    {
        this.Team = team;
        this.LevelPoint = levelPoint;
    }
}

export class TeamMember
{
    ID: string;
    MemberID: string;
    Name: string;
    YOB: number;
    Email: string;
    Role: string;
    Team: string;

    constructor(
        id: string,
        memberId: string,
        name: string,
        yob: number,
        email: string,
        role: string,
        team: string
    )
    {
        this.ID = id;
        this.MemberID = memberId;
        this.Name = name;
        this.YOB = yob;
        this.Email = email;
        this.Role = role;
        this.Team = team;
    }
}

export class WeeklyOrder
{
    ID: string;
    StartWeek: string;
    Goal: string;
    Strategy: string;
    Project: string;
    CPP: number;
    Icon: number;
    Banner: number;
    PLA: number;
    Video: number;

    constructor(
        id: string,
        startWeek: string,
        goal: string,
        strategy: string,
        project: string,
        cpp: number,
        icon: number,
        banner: number,
        pla: number,
        video: number
    )
    {
        this.ID = id;
        this.StartWeek = startWeek;
        this.Goal = goal;
        this.Strategy = strategy;
        this.Project = project;
        this.CPP = cpp;
        this.Icon = icon;
        this.Banner = banner;
        this.PLA = pla;
        this.Video = video;
    }
}

export class ProjectDetail 
{
	ProjectID : number
	Project   : string
	Research  : string
	Art       : string
	Concept   : string
	Video     : string
	Pla       : string
    UA: string
    
    constructor(
        projectID: number,
        project: string,
        research: string,
        art: string,
        concept: string,
        video: string,
        pla: string,
        ua: string
    )
    {
        this.ProjectID = projectID;
        this.Project = project;
        this.Research = research;
        this.Art = art;
        this.Concept = concept;
        this.Video = video;
        this.Pla = pla;
        this.UA = ua;
    }
}

export class WeeklyTarget 
{
    Team: string;
    Point: number;
    DateFrom: string;
    DateTo: string;

    constructor(
        team: string,
        point: number,
        dateFrom: string,
        dateTo: string
    )
    {
        this.Team = team;
        this.Point = point;
        this.DateFrom = dateFrom;
        this.DateTo = dateTo;
    }
}

export class AdministratorData
{
    TeamMembers: TeamMember[] = [];
    WeeklyOrders: WeeklyOrder[] = [];

    memberEmailMap: Map<string, string> = new Map<string, string>();
    emailMemberMap: Map<string, string> = new Map<string, string>();

    CretiveTools: CreativeTool[] = [];
    Levels: Level[] = [];
    WeeklyTargets: WeeklyTarget[] = [];
    ProjectDetails: ProjectDetail[] = [];

    private projectList : string[] = [];

    public getMemberEmail(name: string): string | undefined
    {
        if (this.memberEmailMap.size === 0)
        {
            this.TeamMembers.forEach((m) => this.memberEmailMap.set(m.Name, m.Email));
        }
        return this.memberEmailMap.get(name);
    }

    public getMember(email: string): string | undefined
    {
        if (this.emailMemberMap.size === 0)
        {
            this.TeamMembers.forEach((m) => this.emailMemberMap.set(m.Email, m.Name));
        }
        return this.emailMemberMap.get(email);
    }

    public getListProjects(): string[]
    {
        if (this.projectList.length > 0) return this.projectList;

        this.ProjectDetails.forEach((p) => this.projectList.push(p.Project));
        return this.projectList;
    }

}

const AdminData = new AdministratorData();
export default AdminData;
