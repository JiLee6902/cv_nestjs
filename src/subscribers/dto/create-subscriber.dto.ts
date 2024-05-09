import { IsArray, IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateSubscriberDto {
    @IsEmail()
    @IsNotEmpty()
    email: number;

    @IsNotEmpty()
    name: number;

    @IsNotEmpty()
    @IsArray()

    skills: string[];


}
