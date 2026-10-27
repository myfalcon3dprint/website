import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffSession, getSupabaseAdminClient, recordAuditLog } from '@/lib/supabase/server';
import { AdminDataService } from '@/lib/adminDataStore';

export async function GET(request: NextRequest) {
  const auth = await verifyStaffSession(['owner', 'production_operator', 'order_manager']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || 'Only Production Operators, Order Managers, and Studio Owners may view the production queue.' }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const supabase = getSupabaseAdminClient();

    // 1. Fetch printers
    let printers = AdminDataService.getPrinters();
    if (supabase) {
      const { data: dbPrinters } = await supabase.from('printers').select('*').order('name', { ascending: true });
      if (dbPrinters && dbPrinters.length > 0) {
        printers = dbPrinters.map((p) => ({
          id: p.id,
          name: p.name,
          model: p.model,
          technology: p.technology,
          status: p.status,
          bedSizeMm: p.bed_size_mm,
          materialsSupported: p.materials_supported || [],
          location: p.location,
          isConnected: Boolean(p.is_connected),
          lastServiceDate: p.last_service_date,
          notes: p.notes,
        }));
      }
    }

    // 2. Fetch production jobs
    let jobs = AdminDataService.getProductionJobs();
    if (supabase) {
      let query = supabase.from('production_jobs').select('*').order('created_at', { ascending: false });
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      const { data: dbJobs } = await query;
      if (dbJobs && dbJobs.length > 0) {
        jobs = dbJobs.map((j) => ({
          id: j.id,
          jobNumber: j.job_number,
          orderId: j.order_id,
          orderNumber: j.order_number,
          orderItemId: j.order_item_id,
          itemTitle: j.item_title,
          variantSku: j.variant_sku,
          quantity: j.quantity,
          completedQuantity: j.completed_quantity || 0,
          material: j.material,
          color: j.color,
          technology: j.technology,
          priority: j.priority,
          status: j.status,
          printerId: j.printer_id,
          externalSupplierName: j.external_supplier_name,
          operatorName: j.operator_name,
          estimatedPrintMinutes: j.estimated_print_minutes,
          dueDate: j.due_date,
          qcPass: j.qc_pass,
          qcNotes: j.qc_notes,
          qcFailedReason: j.qc_failed_reason,
          reworkQuantity: j.rework_quantity || 0,
          progressPhotos: j.progress_photos || [],
          staffNotes: j.staff_notes,
          createdAt: j.created_at,
          updatedAt: j.updated_at,
        }));
      }
    }

    // 3. Ready stock items that bypassed printing and are waiting to pack
    let readyStockOrders: unknown[] = [];
    if (supabase) {
      const { data: dbReady } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('status', 'confirmed')
        .order('created_at', { ascending: true });
      if (dbReady) {
        readyStockOrders = dbReady.filter((o) =>
          o.order_items?.every((item: { stock_type: string }) => item.stock_type === 'ready_stock')
        );
      }
    }

    return NextResponse.json({
      jobs,
      printers,
      readyStockOrders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve production queue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyStaffSession(['owner', 'production_operator']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || 'Only Production Operators and Studio Owners may manage print jobs.' }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { action } = body;

    const supabase = getSupabaseAdminClient();

    // Action A: Create a production job
    if (action === 'create_job') {
      const { orderId, orderNumber, orderItemId, itemTitle, variantSku, quantity, material, color, technology, priority, printerId, externalSupplierName, dueDate } = body;

      const newJob = AdminDataService.addProductionJob({
        orderId,
        orderNumber,
        orderItemId,
        itemTitle,
        variantSku,
        quantity: Math.max(1, quantity || 1),
        completedQuantity: 0,
        material: material || 'PLA',
        color: color || 'Black',
        technology: technology || 'FDM',
        priority: priority || 'normal',
        status: printerId ? 'printing' : 'waiting_to_print',
        printerId: printerId || null,
        externalSupplierName: externalSupplierName || null,
        operatorName: auth.profile.full_name,
        dueDate: dueDate || null,
        qcPass: null,
        reworkQuantity: 0,
        progressPhotos: [],
      });

      if (supabase) {
        await supabase.from('production_jobs').insert([
          {
            id: newJob.id,
            job_number: newJob.jobNumber,
            order_id: newJob.orderId,
            order_item_id: newJob.orderItemId,
            item_title: newJob.itemTitle,
            variant_sku: newJob.variantSku,
            quantity: newJob.quantity,
            completed_quantity: newJob.completedQuantity,
            material: newJob.material,
            color: newJob.color,
            technology: newJob.technology,
            priority: newJob.priority,
            status: newJob.status,
            printer_id: newJob.printerId,
            external_supplier_name: newJob.externalSupplierName,
            operator_name: newJob.operatorName,
            due_date: newJob.dueDate,
          },
        ]);
      }

      try {
        await recordAuditLog({
          staffUserId: auth.user.id,
          staffName: auth.profile.full_name,
          staffRole: auth.profile.role,
          action: 'CREATE_PRODUCTION_JOB',
          entityType: 'order',
          entityId: newJob.jobNumber,
          newState: newJob as unknown as Record<string, unknown>,
          notes: `Created production job ${newJob.jobNumber} for ${newJob.itemTitle} (Qty: ${newJob.quantity})`,
        });
      } catch {
        AdminDataService.recordAudit({
          staffUserId: auth.user.id,
          staffName: auth.profile.full_name,
          staffRole: auth.profile.role,
          action: 'CREATE_PRODUCTION_JOB',
          entityType: 'order',
          entityId: newJob.jobNumber,
          newState: newJob as unknown as Record<string, unknown>,
          notes: `Created production job ${newJob.jobNumber} for ${newJob.itemTitle} (Qty: ${newJob.quantity})`,
        });
      }

      return NextResponse.json({ success: true, job: newJob });
    }

    // Action B: Register a new printer or workshop machine
    if (action === 'register_printer') {
      const { id, name, model, technology, status, location, notes, bedSizeMm, materialsSupported } = body;
      if (!name || !model) {
        return NextResponse.json({ error: 'Printer name and model are required' }, { status: 400 });
      }

      const printerId = id || `PRN-${Date.now().toString().slice(-6)}`;
      const newPrinter = AdminDataService.addPrinter({
        id: printerId,
        name,
        model,
        technology: technology || 'FDM',
        status: status || 'available',
        location: location || 'Nashik Hub Workshop',
        notes: notes || '',
        bedSizeMm: bedSizeMm || { x: 256, y: 256, z: 256 },
        materialsSupported: materialsSupported || ['PLA', 'PETG'],
        isConnected: false,
      });

      if (supabase) {
        await supabase.from('printers').upsert({
          id: newPrinter.id,
          name: newPrinter.name,
          model: newPrinter.model,
          technology: newPrinter.technology,
          status: newPrinter.status,
          location: newPrinter.location,
          notes: newPrinter.notes,
          bed_size_mm: newPrinter.bedSizeMm,
          materials_supported: newPrinter.materialsSupported,
          is_connected: false,
        });
      }

      return NextResponse.json({ success: true, printer: newPrinter });
    }

    return NextResponse.json({ error: 'Unknown production action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Production request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyStaffSession(['owner', 'production_operator']);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || 'Only Production Operators and Studio Owners may update quality check status or printers.' }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { action, jobId, printerId, updates } = body;

    const supabase = getSupabaseAdminClient();

    // 1. Quality Check Pass / Fail Workflow
    if (action === 'quality_check') {
      const { passed, reason, reworkQuantity, staffNotes } = body;
      if (typeof passed !== 'boolean') {
        return NextResponse.json({ error: 'Quality check pass status (true/false) is required' }, { status: 400 });
      }

      const jobUpdates = passed
        ? {
            status: 'ready_to_pack' as const,
            qcPass: true,
            qcNotes: staffNotes || 'Passed visual and dimensional inspection.',
            qcFailedReason: null,
          }
        : {
            status: 'qc_failed' as const,
            qcPass: false,
            qcFailedReason: reason || 'Defect observed during quality check',
            reworkQuantity: Math.max(1, reworkQuantity || 1),
            qcNotes: staffNotes || '',
          };

      const updatedJob = AdminDataService.updateProductionJob(jobId, jobUpdates);

      if (supabase) {
        await supabase
          .from('production_jobs')
          .update({
            status: jobUpdates.status,
            qc_pass: jobUpdates.qcPass,
            qc_notes: jobUpdates.qcNotes,
            qc_failed_reason: jobUpdates.qcFailedReason,
            rework_quantity: jobUpdates.reworkQuantity || 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobId);
      }

      try {
        await recordAuditLog({
          staffUserId: auth.user.id,
          staffName: auth.profile.full_name,
          staffRole: auth.profile.role,
          action: passed ? 'QC_PASSED_JOB' : 'QC_FAILED_JOB',
          entityType: 'order',
          entityId: jobId,
          newState: jobUpdates,
          notes: passed ? 'Job passed quality check' : `QC failed: ${reason}. Rework qty: ${reworkQuantity}`,
        });
      } catch {
        AdminDataService.recordAudit({
          staffUserId: auth.user.id,
          staffName: auth.profile.full_name,
          staffRole: auth.profile.role,
          action: passed ? 'QC_PASSED_JOB' : 'QC_FAILED_JOB',
          entityType: 'order',
          entityId: jobId,
          newState: jobUpdates,
          notes: passed ? 'Job passed quality check' : `QC failed: ${reason}. Rework qty: ${reworkQuantity}`,
        });
      }

      return NextResponse.json({ success: true, job: updatedJob });
    }

    // 2. Generic Job Status Update (Waiting to Print -> Printing -> Finishing -> Quality Check -> Ready to Pack)
    if (jobId && updates) {
      const updatedJob = AdminDataService.updateProductionJob(jobId, updates);
      if (supabase) {
        await supabase
          .from('production_jobs')
          .update({
            status: updates.status,
            printer_id: updates.printerId,
            operator_name: updates.operatorName,
            completed_quantity: updates.completedQuantity,
            staff_notes: updates.staffNotes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', jobId);
      }

      return NextResponse.json({ success: true, job: updatedJob });
    }

    // 3. Printer Status Update (Available, Printing, Maintenance, Unavailable)
    if (printerId && updates) {
      const updatedPrinter = AdminDataService.updatePrinter(printerId, updates);
      if (supabase) {
        await supabase
          .from('printers')
          .update({
            status: updates.status,
            notes: updates.notes,
            location: updates.location,
            updated_at: new Date().toISOString(),
          })
          .eq('id', printerId);
      }

      return NextResponse.json({ success: true, printer: updatedPrinter });
    }

    return NextResponse.json({ error: 'Invalid production update payload' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update production';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
