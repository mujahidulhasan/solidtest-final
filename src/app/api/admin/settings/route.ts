import { supabase } from '@/lib/supabase';
import { createHash } from 'crypto';

function hashPw(pw: string) {
  return createHash('sha256').update(pw).digest('hex');
}

export async function GET() {
  const { data, error } = await supabase.from('admin_settings').select('*').single();
  if (error) return Response.json({ allow_tab_switch: false, fullscreen_required: false });
  const { admin_password_hash: _, ...rest } = data;
  return Response.json(rest);
}

// POST: change password (verifies current password first)
export async function POST(request: Request) {
  const body = await request.json();
  const { current_password, new_password } = body;
  if (!current_password || !new_password)
    return Response.json({ error: 'current_password and new_password required' }, { status: 400 });

  const currentHash = hashPw(current_password);
  const { data } = await supabase.from('admin_settings').select('id,admin_password_hash').single();

  // If no row, check against default "123"
  const storedHash = data?.admin_password_hash ?? hashPw('123');
  if (currentHash !== storedHash)
    return Response.json({ error: 'Current password is incorrect' }, { status: 401 });

  const newHash = hashPw(new_password);
  if (data) {
    await supabase
      .from('admin_settings')
      .update({ admin_password_hash: newHash })
      .eq('id', data.id);
  } else {
    await supabase.from('admin_settings').insert({
      admin_password_hash: newHash,
      allow_tab_switch: false,
      fullscreen_required: false,
    });
  }
  return Response.json({ success: true });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { allow_tab_switch, fullscreen_required, new_password } = body;

  const updateData: Record<string, unknown> = { allow_tab_switch, fullscreen_required };
  if (new_password) {
    updateData.admin_password_hash = hashPw(new_password);
  }

  const { data: existing } = await supabase.from('admin_settings').select('id').single();
  if (existing) {
    const { error } = await supabase
      .from('admin_settings')
      .update(updateData)
      .eq('id', existing.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from('admin_settings').insert({
      ...updateData,
      admin_password_hash: updateData.admin_password_hash || hashPw('123'),
    });
    if (error) return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ success: true });
}
