import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);



    async sendPasswordResetEmail(email: string, code: string) {
        this.logger.log(`\n\n====================================================`);
        this.logger.log(`🔑  PASSWORD RESET CODE`);
        this.logger.log(`To: ${email}`);
        this.logger.log(`Code: ${code}`);
        this.logger.log(`(Valid for 10 minutes)`);
        this.logger.log(`====================================================\n`);
    }
}
