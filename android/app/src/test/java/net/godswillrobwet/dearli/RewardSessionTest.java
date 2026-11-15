package net.godswillrobwet.dearli;

import org.junit.Test;
import static org.junit.Assert.*;

public class RewardSessionTest {
    @Test public void completionGrantsOnlyOnce() {
        RewardSession session = new RewardSession("completion-1");
        assertTrue(session.earn()); assertFalse(session.earn());
        session.close(); assertTrue(session.isEarned()); assertFalse(session.earn());
    }
    @Test public void earlyCloseOrFailureDoesNotEarn() {
        RewardSession session = new RewardSession("dismissal");
        session.close(); assertFalse(session.isEarned()); assertFalse(session.earn());
    }
    @Test public void sessionsCannotTransferCompletions() {
        RewardSession first = new RewardSession("first"), second = new RewardSession("second");
        first.earn(); first.close(); assertFalse(second.isEarned());
    }
}
