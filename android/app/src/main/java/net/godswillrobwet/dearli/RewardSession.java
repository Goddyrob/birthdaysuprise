package net.godswillrobwet.dearli;

/** A single native ad completion. Dismissal/failure closes it without earning. */
final class RewardSession {
    final String id;
    private boolean earned;
    private boolean closed;

    RewardSession(String id) { this.id = id; }
    synchronized boolean earn() {
        if (closed || earned) return false;
        earned = true;
        return true;
    }
    synchronized boolean isEarned() { return earned; }
    synchronized void close() { closed = true; }
}
