package com.siraha.myweb;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register any additional plugins here if needed
        // this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
        //     add(YourPlugin.class);
        // }});
    }
}