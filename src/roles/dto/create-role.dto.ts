import { IsArray, IsBoolean, IsMongoId, IsNotEmpty } from "class-validator";
import mongoose from "mongoose";

export class CreateRoleDto {
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    description: string;

    @IsNotEmpty()
    @IsBoolean()
    isActive:boolean;
       
    @IsNotEmpty()
    @IsArray()
    @IsMongoId()
    permissions:  mongoose.Schema.Types.ObjectId[];
}
