'use server'

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {z} from 'zod';

const formSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['paid', 'pending']),
    date: z.string(),
});

const CreateInvoice = formSchema.omit({id: true, date: true});

export default async function createInvoice(formData: FormData) {
    const rawFormData = {
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    };

    let parsedFormData = CreateInvoice.parse(rawFormData);
    parsedFormData.amount = parsedFormData.amount * 100;
    const currentDate = new Date().toISOString().split('T')[0];

    try {
        //store in db
        sql`INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${parsedFormData.customerId}, ${parsedFormData.amount}, ${parsedFormData.status}, ${currentDate})`;
        // clean browser cache that nextJS does by default for routes
        revalidatePath('/dashboard/invoices');
        // navigate back to invoices
        redirect('/dashboard/invoices');
    } catch(e) {
        return {
            message: "Database Error: Failed to create invoice",
            error: e
        };
    }
}

const UpdateInvoice = formSchema.omit({id: true, date: true});

export async function updateInvoiceById(formData: FormData, id: string) {

    const rawFormData = {
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    };

    let parsedFormData = UpdateInvoice.parse(rawFormData);

    parsedFormData.amount = parsedFormData.amount * 100;

    try {
        //store in db
        await sql`UPDATE invoices
        SET customer_id = ${parsedFormData.customerId},
        amount = ${parsedFormData.amount},
        status = ${parsedFormData.status}
        WHERE id = ${id}`;

        // clean browser cache that nextJS does by default for routes
        revalidatePath('/dashboard/invoices');
        // navigate back to invoices
        redirect('/dashboard/invoices');
    } catch(e) {
        return {
            message: "Database Error: Failed to update invoice",
            error: e
        };
    }
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
            error: e
        };
    }
}