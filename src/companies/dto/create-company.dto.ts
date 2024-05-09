
import { IsNotEmpty, IsEmail } from "class-validator";


export class CreateCompanyDto {

    @IsNotEmpty({message: 'Name không được để trống'})
    name: string;

    @IsNotEmpty()
    address: string;

    @IsNotEmpty()
    description: string;

    @IsNotEmpty()
    logo: string;

}
