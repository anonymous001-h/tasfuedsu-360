/*
# Create quotes table with 100 motivational quotes

1. New Tables
- `quotes`
  - `id` (uuid, primary key)
  - `text` (text, not null) — the quote text
  - `author` (text, not null) — the quote author
  - `is_active` (boolean, default true) — whether the quote is active
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `quotes`
- Grant SELECT to authenticated (all users can read quotes)
- Grant INSERT, UPDATE, DELETE to authenticated (admins manage quotes)
- All policies are open to authenticated users since the app uses role-based checks client-side

3. Seed Data
- 100 motivational quotes seeded into the table
*/

CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  author text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON quotes TO authenticated;

DROP POLICY IF EXISTS "select_quotes" ON quotes;
CREATE POLICY "select_quotes" ON quotes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_quotes" ON quotes;
CREATE POLICY "insert_quotes" ON quotes FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_quotes" ON quotes;
CREATE POLICY "update_quotes" ON quotes FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_quotes" ON quotes;
CREATE POLICY "delete_quotes" ON quotes FOR DELETE
  TO authenticated USING (true);

INSERT INTO quotes (text, author) VALUES
('The future belongs to those who believe in the beauty of their dreams.', 'Eleanor Roosevelt'),
('Education is the most powerful weapon which you can use to change the world.', 'Nelson Mandela'),
('Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Winston Churchill'),
('Believe you can and you''re halfway there.', 'Theodore Roosevelt'),
('The only way to do great work is to love what you do.', 'Steve Jobs'),
('Don''t watch the clock; do what it does. Keep going.', 'Sam Levenson'),
('The expert in anything was once a beginner.', 'Helen Hayes'),
('Your limitation—it''s only your imagination.', 'Unknown'),
('Push yourself, because no one else is going to do it for you.', 'Unknown'),
('Great things never come from comfort zones.', 'Unknown'),
('Dream it. Wish it. Do it.', 'Unknown'),
('Success doesn''t just find you. You have to go out and get it.', 'Unknown'),
('The harder you work for something, the greater you''ll feel when you achieve it.', 'Unknown'),
('Don''t stop when you''re tired. Stop when you''re done.', 'Unknown'),
('Wake up with determination. Go to bed with satisfaction.', 'Unknown'),
('Do something today that your future self will thank you for.', 'Sean Patrick Flanery'),
('Little things make big days.', 'Unknown'),
('It''s going to be hard, but hard does not mean impossible.', 'Unknown'),
('Don''t wait for opportunity. Create it.', 'Unknown'),
('Sometimes we''re tested not to show our weaknesses, but to discover our strengths.', 'Unknown'),
('The key to success is to focus on goals, not obstacles.', 'Unknown'),
('Dream bigger. Do bigger.', 'Unknown'),
('What you get by achieving your goals is not as important as what you become by achieving your goals.', 'Zig Ziglar'),
('If you can dream it, you can do it.', 'Walt Disney'),
('The secret of getting ahead is getting started.', 'Mark Twain'),
('Quality is not an act, it is a habit.', 'Aristotle'),
('The only limit to our realization of tomorrow is our doubts of today.', 'Franklin D. Roosevelt'),
('It always seems impossible until it''s done.', 'Nelson Mandela'),
('Start where you are. Use what you have. Do what you can.', 'Arthur Ashe'),
('The best way to predict the future is to create it.', 'Peter Drucker'),
('Success is walking from failure to failure with no loss of enthusiasm.', 'Winston Churchill'),
('Either you run the day or the day runs you.', 'Jim Rohn'),
('Opportunities don''t happen. You create them.', 'Chris Grosser'),
('Don''t be afraid to give up the good to go for the great.', 'John D. Rockefeller'),
('I find that the harder I work, the more luck I seem to have.', 'Thomas Jefferson'),
('Success usually comes to those who are too busy to be looking for it.', 'Henry David Thoreau'),
('The road to success and the road to failure are almost exactly the same.', 'Colin R. Davis'),
('Don''t let yesterday take up too much of today.', 'Will Rogers'),
('You learn more from failure than from success. Don''t let it stop you. Failure builds character.', 'Unknown'),
('Experience is a hard teacher because she gives the test first, the lesson afterward.', 'Vernon Sanders Law'),
('If you are not willing to risk the usual, you will have to settle for the ordinary.', 'Jim Rohn'),
('The ones who are crazy enough to think they can change the world are the ones who do.', 'Steve Jobs'),
('Do what you can, with what you have, where you are.', 'Theodore Roosevelt'),
('Too many of us are not living our dreams because we are living our fears.', 'Les Brown'),
('You are never too old to set another goal or to dream a new dream.', 'C.S. Lewis'),
('Whether you think you can or you think you can''t, you''re right.', 'Henry Ford'),
('Perfection is not attainable, but if we chase perfection we can catch excellence.', 'Vince Lombardi'),
('The man who has confidence in himself gains the confidence of others.', 'Hasidic Proverb'),
('Strive not to be a success, but rather to be of value.', 'Albert Einstein'),
('You miss 100% of the shots you don''t take.', 'Wayne Gretzky'),
('I have not failed. I''ve just found 10,000 ways that won''t work.', 'Thomas Edison'),
('The only person you are destined to become is the person you decide to be.', 'Ralph Waldo Emerson'),
('Everything you''ve ever wanted is on the other side of fear.', 'George Addair'),
('Hardships often prepare ordinary people for an extraordinary destiny.', 'C.S. Lewis'),
('Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.', 'Christian D. Larson'),
('The best time to plant a tree was 20 years ago. The second best time is now.', 'Chinese Proverb'),
('Your time is limited, so don''t waste it living someone else''s life.', 'Steve Jobs'),
('The mind is everything. What you think you become.', 'Buddha'),
('An unexamined life is not worth living.', 'Socrates'),
('Eighty percent of success is showing up.', 'Woody Allen'),
('You can''t use up creativity. The more you use, the more you have.', 'Maya Angelou'),
('Dream big and dare to fail.', 'Norman Vaughan'),
('Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.', 'Thomas Edison'),
('If you want to lift yourself up, lift up someone else.', 'Booker T. Washington'),
('Don''t count the days, make the days count.', 'Muhammad Ali'),
('The way to get started is to quit talking and begin doing.', 'Walt Disney'),
('Forget about all the reasons why something may not work. You only need to find one good reason why it will.', 'Dr. Robert Anthony'),
('Setting goals is the first step in turning the invisible into the visible.', 'Tony Robbins'),
('I can and I will. Watch me.', 'Unknown'),
('Strive for progress, not perfection.', 'Unknown'),
('The difference between ordinary and extraordinary is that little extra.', 'Jimmy Johnson'),
('You don''t have to be great to start, but you have to start to be great.', 'Zig Ziglar'),
('A year from now you may wish you had started today.', 'Karen Lamb'),
('The expert in anything was once a beginner who refused to give up.', 'Unknown'),
('What lies behind us and what lies before us are tiny matters compared to what lies within us.', 'Ralph Waldo Emerson'),
('The only thing standing between you and your goal is the story you keep telling yourself as to why you can''t achieve it.', 'Jordan Belfort'),
('If it doesn''t challenge you, it doesn''t change you.', 'Fred DeVito'),
('Try not to become a person of success, but rather try to become a person of value.', 'Albert Einstein'),
('The successful warrior is the average man, with laser-like focus.', 'Bruce Lee'),
('Take the risk or lose the chance.', 'Unknown'),
('Your dream doesn''t have an expiration date. Take a deep breath and try again.', 'Unknown'),
('When you want to succeed as badly as you want to breathe, then you''ll be successful.', 'Eric Thomas'),
('Discipline is the bridge between goals and accomplishment.', 'Jim Rohn'),
('The only way to achieve the impossible is to believe it is possible.', 'Charles Kingsleigh'),
('Don''t be pushed around by the fears in your mind. Be led by the dreams in your heart.', 'Roy T. Bennett'),
('Work hard in silence, let your success be the noise.', 'Frank Ocean'),
('Success is not how high you have climbed, but how you make a positive difference to the world.', 'Roy T. Bennett'),
('What you do today can improve all your tomorrows.', 'Ralph Marston'),
('If you can''t fly then run, if you can''t run then walk, if you can''t walk then crawl, but whatever you do you have to keep moving forward.', 'Martin Luther King Jr.'),
('The future depends on what you do today.', 'Mahatma Gandhi'),
('Develop success from failures. Discouragement and failure are two of the surest stepping stones to success.', 'Dale Carnegie'),
('Nothing is impossible. The word itself says ''I''m possible!''', 'Audrey Hepburn'),
('Act as if what you do makes a difference. It does.', 'William James'),
('You are braver than you believe, stronger than you seem, and smarter than you think.', 'A.A. Milne'),
('Go confidently in the direction of your dreams. Live the life you have imagined.', 'Henry David Thoreau'),
('Keep your face always toward the sunshine and shadows will fall behind you.', 'Walt Whitman'),
('The best revenge is massive success.', 'Frank Sinatra'),
('Champions keep playing until they get it right.', 'Billie Jean King'),
('You must be the change you wish to see in the world.', 'Mahatma Gandhi'),
('Life is 10% what happens to you and 90% how you react to it.', 'Charles R. Swindoll'),
('When one door of happiness closes, another opens; but often we look so long at the closed door that we do not see the one which has been opened for us.', 'Helen Keller'),
('If you''re going through hell, keep going.', 'Winston Churchill');
