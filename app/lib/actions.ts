'use server'

import { signIn } from '@/auth';
import { sql } from '@vercel/postgres';
import { AuthError } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {z} from 'zod';

const formSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer'
    }),
    amount: z.coerce.number().gt(0, {message: 'Please enter an amount greater than $0.'}),
    status: z.enum(['paid', 'pending'], {
        invalid_type_error: 'Please select an invoice status.'
    }),
    date: z.string(),
});

export type State = {
    errors?: {
      customerId?: string[];
      amount?: string[];
      status?: string[];
    };
    message?: string | null;
  };

const CreateInvoice = formSchema.omit({id: true, date: true});

export async function authenticate(prevState: string|undefined, formData: FormData) {
    try {
        await signIn('credenrials', formData);
    } catch(e) {
        if (e instanceof AuthError) {
            switch(e.type) {
                case 'CredentialsSignin' :
                    return 'Invalid credentials';
                default:
                    return 'Something went wrong';
            }
        }
        throw e;
    }
}

export default async function createInvoice(prevState: State, formData: FormData) {
    const rawFormData = {
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    };

    let parsedFormData = CreateInvoice.safeParse(rawFormData);

    if (!parsedFormData.success) {
        return {
            errors: parsedFormData.error.flatten().fieldErrors,
            message: "Missing Fields data. Failed to create invoice"
        }
    }
    if (parsedFormData.data) {
        parsedFormData.data.amount = parsedFormData.data.amount * 100;
    }
    const currentDate = new Date().toISOString().split('T')[0];

    try {
        //store in db
        sql`INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${parsedFormData.data.customerId}, ${parsedFormData.data.amount}, ${parsedFormData.data.status}, ${currentDate})`;
    } catch(e) {
        console.log(e);
        return {
            message: "Database Error: Failed to create invoice",
        };
    }
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

const UpdateInvoice = formSchema.omit({id: true, date: true});

export async function updateInvoiceById(id: string, _prevState: State, formData: FormData): Promise<State> {

    // console.log("recieved form data ", formData);
    const rawFormData = {
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    };

    let isParsed = UpdateInvoice.safeParse(rawFormData);

    if (!isParsed.success) {
        return {
            errors: isParsed.error.flatten().fieldErrors,
            message: "Missing Fields data. Failed to update invoice"
        }
    }
    const parsedFormData = isParsed.data;
    parsedFormData.amount = parsedFormData.amount * 100;

    try {
        //store in db
        await sql`UPDATE invoices
        SET customer_id = ${parsedFormData.customerId},
        amount = ${parsedFormData.amount},
        status = ${parsedFormData.status}
        WHERE id = ${id}`;
    } catch(e) {
        return {
            message: "Database Error: Failed to update invoice",
        };
    }
    // clean browser cache that nextJS does by default for routes
    revalidatePath('/dashboard/invoices');
    // navigate back to invoices
    redirect('/dashboard/invoices');
}

export async function deleteInvoiceById(id: string) {
    try {
        //store in db
        await sql`DELETE FROM invoices
        WHERE id = ${id}`;
        // clean browser cache that nextJS does by default for routes
        revalidatePath('/dashboard/invoices');
        // navigate back to invoices
        redirect('/dashboard/invoices');
    } catch(e) {
        return {
            message: "Database Error: Failed to delete invoice",
        };
    }
}