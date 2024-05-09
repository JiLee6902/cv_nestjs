
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Company } from 'src/companies/schemas/company.schema';
import { Job } from 'src/jobs/schema/job.schema';


// 3 kiểu export trong 1 schema
export type ResumeDocument = HydratedDocument<Resume>;

@Schema({timestamps: true})
export class Resume {
    
    @Prop()
    email: string;

    @Prop()
    userId: mongoose.Types.ObjectId;

    @Prop()
    url: string;

    @Prop()
    status: string;

    //cho HR tuyen employee
    @Prop({type: mongoose.Schema.Types.ObjectId, ref:Company.name})
    companyId: mongoose.Schema.Types.ObjectId;
       
    @Prop({type: mongoose.Schema.Types.ObjectId, ref:Job.name})
    jobId:  mongoose.Schema.Types.ObjectId;
       
    //mảng array gồm các object
    //khác với history: string[] nên phải khai báo type rõ ràng
    @Prop({type: mongoose.Schema.Types.Array})
    history: {
        status: string;
        updatedAt: Date;
        updatedBy: {
            _id: mongoose.Schema.Types.ObjectId;
            email: string
        };
    }[];


    @Prop({ type: Object })
    createdBy: {
        _id: mongoose.Schema.Types.ObjectId;
        email: string
    };

    @Prop({ type: Object })
    updatedBy: {
        _id: mongoose.Schema.Types.ObjectId;
        email: string
    };

    @Prop({ type: Object })
    deletedBy: {
        _id: mongoose.Schema.Types.ObjectId;
        email: string
    };


    @Prop()
    createdAt: Date;

    @Prop()
    updatedAt: Date;

    @Prop()
    isDeleted: boolean;

    @Prop()
    deletedAt: Date;
}

export const ResumeSchema = SchemaFactory.createForClass(Resume);