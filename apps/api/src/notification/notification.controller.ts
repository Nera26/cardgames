import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Req,
    UseGuards,
    Param,
    Query,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../user/guards/roles.guard';
import { Roles } from '../user/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { NotificationType, Role, createNotificationSchema, CreateNotificationDto } from '@poker/shared';

@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    async getMyNotifications(
        @Req() req: AuthenticatedRequest,
        @Query('limitGlobal') limitGlobal?: number,
        @Query('limitPersonal') limitPersonal?: number,
    ) {
        return this.notificationService.getNotifications(req.user.id, limitGlobal, limitPersonal);
    }

    @Patch(':id/read')
    @UseGuards(JwtAuthGuard)
    async markAsRead(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.notificationService.markAsRead(id, req.user.id);
    }

    @Patch('read-all')
    @UseGuards(JwtAuthGuard)
    async markAllAsRead(@Req() req: AuthenticatedRequest) {
        return this.notificationService.markAllAsRead(req.user.id);
    }

    // ==================== ADMIN: Global Broadcast ====================
    @Post('broadcast')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    @UsePipes(new ZodValidationPipe(createNotificationSchema))
    async broadcast(@Body() dto: CreateNotificationDto) {
        return this.notificationService.sendGlobal(dto.title, dto.message, dto.type, dto.metadata);
    }

    // ==================== DEBUG: Test Hooks ====================
    @Post('debug/tournament-alert')
    async debugTournament() {
        return this.notificationService.sendGlobal(
            'Tournament Starting',
            'Sunday Million starts in 10 minutes!',
            NotificationType.TOURNAMENT,
            { tournamentId: 'debug-1' }
        );
    }

    @Post('debug/personal-win/:userId')
    async debugPersonal(@Param('userId') userId: string) {
        return this.notificationService.sendPersonal(
            userId,
            'Big Win!',
            'You won 500 chips in a showdown!',
            NotificationType.SYSTEM,
            { amount: 500 }
        );
    }
}
