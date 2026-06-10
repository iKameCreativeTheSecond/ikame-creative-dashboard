//#region 

export type UserInfo = {
    email: string;
    name: string;
    picture: string;
}

//endregion

// #region global data

export const User: UserInfo = {
    email: '',
    name: '',
    picture: ''
};

export class GlobalData
{
    private static UserToken: string = undefined as any;
    private static User: UserInfo = undefined as any;

    static Save() 
    {
        localStorage.setItem('userToken', this.UserToken);
        localStorage.setItem('user', JSON.stringify(this.User));
    }

    public static setUserToken(value: string)
    {
        this.UserToken = value;
        GlobalData.Save();
    }

    public static getUserToken(): string
    {
        if (!this.UserToken)
        {
            const token = localStorage.getItem('userToken');
            if (token) this.UserToken = token;
        }
        return this.UserToken;
    }


    public static setUser(value: UserInfo)
    {
        this.User = value;
        GlobalData.Save();
    }

    public static getUser(): UserInfo
    {
        if (!this.User)
        {
            const userJson = localStorage.getItem('user');
            if (userJson) this.User = JSON.parse(userJson);
        }
        return this.User;
    }

    public static logout()
    {
        this.UserToken = undefined as any;
        this.User = undefined as any;
        localStorage.removeItem('userToken');
        localStorage.removeItem('user');
    }
}

export function GetTeamFromTaskType(taskType: string): string
{
    switch (taskType)
    {
        case 'art_cpp':
            return 'Art'
        case 'art_icon':
            return 'Art'
        case 'art_banner':
            return 'Art'
        case 'playable':
            return 'PLA'
        case 'video':
            return 'Video'
        default:
            return 'Concept'
    }
}
//endregion