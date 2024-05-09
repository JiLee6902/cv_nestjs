import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { ApiTags } from '@nestjs/swagger';
import { IUser } from 'src/users/users.interface';


@ApiTags('permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @ResponseMessage("Create a new Permission")
  create(
    @Body() createPermissionDto: CreatePermissionDto,
    @User() user: IUser
  ) {
    
    return this.permissionsService.create(createPermissionDto, user);
  }

  
  @Get()
  @ResponseMessage("Fetch List Permission with paginate")
  findAll(
    @Query('current') currentPage: string,
    @Query('pageSize') limit: string,
    @Query() qs: string
    ) {
    return this.permissionsService.findAll(+currentPage, +limit, qs);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage("Update a Permission")
  update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
    @User() user: IUser
  ) {
    return this.permissionsService.update(id,updatePermissionDto, user);
  }

  @Delete(':id')
  @ResponseMessage("Delete a Permission")
  remove(
    @Param('id') id: string,
    @User() user: IUser
    ) {
    return this.permissionsService.remove(id, user);
  }
}
