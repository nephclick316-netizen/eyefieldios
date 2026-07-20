CREATE TABLE IF NOT EXISTS public.call_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    caller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('voice', 'video')) NOT NULL,
    status TEXT CHECK (status IN ('completed', 'missed', 'rejected')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.call_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own call history"
    ON public.call_history FOR SELECT
    USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert call history"
    ON public.call_history FOR INSERT
    WITH CHECK (auth.uid() = caller_id OR auth.uid() = receiver_id);