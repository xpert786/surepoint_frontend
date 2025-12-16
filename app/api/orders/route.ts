import { NextRequest, NextResponse } from 'next/server';
import { getOrders } from '@/lib/firebase/orders';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('clientId') || undefined;
    const role = searchParams.get('role') as 'client' | 'coo' | 'admin' | undefined;

    const orders = await getOrders(clientId, role);
    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

