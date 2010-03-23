package org.dhappy.mimis;

import java.util.Map;

public interface Holon {
    public Holon self();
    public void impress( Map<String, Object> state );
}
