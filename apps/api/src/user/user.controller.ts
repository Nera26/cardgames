import {
    Controller,
    Get,
    Patch,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
    UsePipes,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import {
    updateProfileSchema,
    updateRoleSchema,
    userListQuerySchema,
    UpdateProfileDto,
    UpdateRoleDto,
    CreateUserDto,
    createUserSchema,
    AdminUpdateUserDto,
    adminUpdateUserSchema,
    UserListQuery,
    Role
} from '@poker/shared';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
    constructor(private readonly userService: UserService) { }

    // ==================== SELF: Profile ====================
    @Get('me')
    async getProfile(@Req() req: AuthenticatedRequest) {
        return this.userService.getProfile(req.user.id);
    }

    @Patch('me')
    @UsePipes(new ZodValidationPipe(updateProfileSchema))
    async updateProfile(@Req() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
        return this.userService.updateProfile(req.user.id, dto);
    }

    // ==================== SELF: Avatar Upload ====================
    @Post('me/avatar')
    @UseInterceptors(FileInterceptor('avatar'))
    async uploadAvatar(
        @Req() req: AuthenticatedRequest,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 500_000 }), // 500KB
                    new FileTypeValidator({ fileType: 'image/webp' }),
                ],
            }),
        )
        file: any,
    ) {
        return this.userService.uploadAvatar(req.user.id, file);
    }

    // ==================== ADMIN: Create User ====================
    @Post('/admin')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    @UsePipes(new ZodValidationPipe(createUserSchema))
    async createUser(@Body() dto: CreateUserDto) {
        return this.userService.createUser(dto);
    }

    // ==================== ADMIN: Update User (Full access) ====================
    @Patch('/admin/:id')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    async adminUpdateUser(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body(new ZodValidationPipe(adminUpdateUserSchema)) dto: AdminUpdateUserDto) {
        return this.userService.adminUpdateUser(req.user.id, id, dto);
    }

    // ==================== ADMIN: User List ====================
    @Get()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    async getAllUsers(@Query() query: UserListQuery) {
        // Manual validation for query params
        const validated = userListQuerySchema.parse(query);
        return this.userService.getAllUsers(validated);
    }

    // ==================== ADMIN: User by ID ====================
    @Get(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    async getUserById(@Param('id') id: string) {
        return this.userService.getUserById(id);
    }

    // ==================== ADMIN: Ban User ====================
    @Post(':id/ban')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    async banUser(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.userService.banUser(req.user.id, id, req.user.role);
    }

    // ==================== ADMIN: Unban User ====================
    @Post(':id/unban')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    async unbanUser(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.userService.unbanUser(req.user.id, id);
    }

    // ==================== SUPERADMIN: Change Role ====================
    @Patch(':id/role')
    @UseGuards(RolesGuard)
    @Roles(Role.SUPERADMIN)
    @UsePipes(new ZodValidationPipe(updateRoleSchema))
    async updateRole(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
        return this.userService.updateRole(req.user.id, id, dto);
    }
}
