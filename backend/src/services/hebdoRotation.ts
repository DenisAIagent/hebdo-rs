import { supabaseAdmin } from '../utils/supabase';
import { formatDateOnly, nextFridayString } from '../utils/dates';

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // every hour

/**
 * Check if the current hebdo's end_date has passed.
 * If so, create the next issue (N+1) anchored on the next Friday.
 *
 * The publication cycle is weekly (Friday → following Friday). The end_date
 * of the current issue is the moment it stops being "current"; the new issue
 * starts on that date and ends the Friday after.
 */
async function rotateHebdoIfNeeded(): Promise<void> {
  try {
    const { data: current, error } = await supabaseAdmin
      .from('hebdo_config')
      .select('*')
      .eq('is_current', true)
      .single();

    if (error || !current) {
      console.log('[hebdo-rotation] No current hebdo found, skipping.');
      return;
    }

    if (!current.end_date) {
      console.log('[hebdo-rotation] Current hebdo has no end_date, skipping.');
      return;
    }

    const now = new Date();
    const endDate = new Date(current.end_date + 'T00:00:00Z');

    if (now < endDate) {
      return; // not yet time to rotate
    }

    const nextNumero = current.numero + 1;
    // Next issue starts on end_date of current, ends on the Friday after that
    const nextStart = endDate;
    const nextEndStr = nextFridayString(nextStart);

    // Unset current
    await supabaseAdmin
      .from('hebdo_config')
      .update({ is_current: false })
      .eq('id', current.id);

    // Create next hebdo
    const { error: insertError } = await supabaseAdmin
      .from('hebdo_config')
      .insert({
        numero: nextNumero,
        label: `RSH${nextNumero}`,
        start_date: formatDateOnly(nextStart),
        end_date: nextEndStr,
        is_current: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[hebdo-rotation] Error creating next hebdo:', insertError);
      // Restore current flag
      await supabaseAdmin
        .from('hebdo_config')
        .update({ is_current: true })
        .eq('id', current.id);
      return;
    }

    console.log(
      `[hebdo-rotation] Rotated: RSH${current.numero} -> RSH${nextNumero} ` +
        `(window: ${formatDateOnly(nextStart)} -> ${nextEndStr})`,
    );
  } catch (err) {
    console.error('[hebdo-rotation] Unexpected error:', err);
  }
}

/**
 * Start the hebdo auto-rotation: check immediately on boot, then every hour.
 */
export function startHebdoRotation(): void {
  console.log('[hebdo-rotation] Auto-rotation enabled (check every hour, Friday→Friday)');
  rotateHebdoIfNeeded();
  setInterval(rotateHebdoIfNeeded, CHECK_INTERVAL_MS);
}
