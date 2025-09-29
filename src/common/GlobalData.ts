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
    static UserToken: string = '';
    
    static User: UserInfo = {
        email: '',
        name: '',
        picture: ''
    }
}

//endregion