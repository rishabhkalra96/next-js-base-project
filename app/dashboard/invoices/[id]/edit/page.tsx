import { fetchCustomers, fetchInvoiceById } from "@/app/lib/data";
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import Form from "@/app/ui/invoices/edit-form";
import {notFound} from "next/navigation";

export default async function Page({params}: {params: {id: string}}) {

    // fetch invoice and customers
    const [invoice, customers] = await Promise.all([
        fetchInvoiceById(params.id),
        fetchCustomers()
    ]);

    if (!invoice) {
        notFound();
    }
    return (
        <main>
            <Breadcrumbs 
                breadcrumbs={[
                    {
                        label: "Invoices",
                        href: "/dashboard/invoices"
                    },
                    {
                        label: `Edit Invoice (${customers.find(customer => customer.id === invoice.customer_id)?.name})`,
                        href: `/dashboard/invoices/${params.id}/edit`,
                        active: true
                    }
                ]}
            />
            <Form invoice={invoice} customers={customers}/>
        </main>
    );
}