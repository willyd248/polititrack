/**
 * House member party list - source of truth for party affiliations
 * 
 * This list is matched against fetched Congress.gov members by name+state+district
 * to populate party data when the API doesn't provide it.
 * 
 * Format: State-District -> { name, party }
 */

export interface HousePartyEntry {
  name: string;
  state: string;
  district: string; // e.g., "01" or "At Large"
  party: "D" | "R" | "I";
}

// Parse the user's House list into structured data
export const HOUSE_PARTY_LIST: HousePartyEntry[] = [
  // Alabama
  { name: "Jerry L. Carl", state: "AL", district: "01", party: "R" },
  { name: "Barry Moore", state: "AL", district: "02", party: "R" },
  { name: "Mike Rogers", state: "AL", district: "03", party: "R" },
  { name: "Robert Aderholt", state: "AL", district: "04", party: "R" },
  { name: "Dale W. Strong", state: "AL", district: "05", party: "R" },
  { name: "Gary Palmer", state: "AL", district: "06", party: "R" },
  { name: "Terri A. Sewell", state: "AL", district: "07", party: "D" },
  
  // Alaska
  { name: "Mary S. Peltola", state: "AK", district: "At Large", party: "D" },
  
  // Arizona
  { name: "David Schweikert", state: "AZ", district: "01", party: "R" },
  { name: "Eli Crane", state: "AZ", district: "02", party: "R" },
  { name: "Yassamin Ansari", state: "AZ", district: "03", party: "D" },
  { name: "Paul Gosar", state: "AZ", district: "04", party: "R" },
  { name: "Andy Biggs", state: "AZ", district: "05", party: "R" },
  { name: "Juan Ciscomani", state: "AZ", district: "06", party: "R" },
  { name: "Raúl Grijalva", state: "AZ", district: "07", party: "D" },
  { name: "Debbie Lesko", state: "AZ", district: "08", party: "R" },
  { name: "Greg Stanton", state: "AZ", district: "09", party: "D" },
  
  // Arkansas
  { name: "Rick Crawford", state: "AR", district: "01", party: "R" },
  { name: "French Hill", state: "AR", district: "02", party: "R" },
  { name: "Steve Womack", state: "AR", district: "03", party: "R" },
  { name: "Bruce Westerman", state: "AR", district: "04", party: "R" },
  
  // California (52 districts)
  { name: "Doug LaMalfa", state: "CA", district: "01", party: "R" },
  { name: "Jared Huffman", state: "CA", district: "02", party: "D" },
  { name: "Kevin Kiley", state: "CA", district: "03", party: "R" },
  { name: "Mike Thompson", state: "CA", district: "04", party: "D" },
  { name: "Tom McClintock", state: "CA", district: "05", party: "R" },
  { name: "Ami Bera", state: "CA", district: "06", party: "D" },
  { name: "Doris Matsui", state: "CA", district: "07", party: "D" },
  { name: "John Garamendi", state: "CA", district: "08", party: "D" },
  { name: "Josh Harder", state: "CA", district: "09", party: "D" },
  { name: "Mark DeSaulnier", state: "CA", district: "10", party: "D" },
  { name: "Nancy Pelosi", state: "CA", district: "11", party: "D" },
  { name: "Barbara Lee", state: "CA", district: "12", party: "D" },
  { name: "John Duarte", state: "CA", district: "13", party: "R" },
  { name: "Eric Swalwell", state: "CA", district: "14", party: "D" },
  { name: "Kevin Mullin", state: "CA", district: "15", party: "D" },
  { name: "Anna Eshoo", state: "CA", district: "16", party: "D" },
  { name: "Ro Khanna", state: "CA", district: "17", party: "D" },
  { name: "Zoe Lofgren", state: "CA", district: "18", party: "D" },
  { name: "Jimmy Panetta", state: "CA", district: "19", party: "D" },
  { name: "Kevin McCarthy", state: "CA", district: "20", party: "R" },
  { name: "Jim Costa", state: "CA", district: "21", party: "D" },
  { name: "David Valadao", state: "CA", district: "22", party: "R" },
  { name: "Jay Obernolte", state: "CA", district: "23", party: "R" },
  { name: "Salud Carbajal", state: "CA", district: "24", party: "D" },
  { name: "Raul Ruiz", state: "CA", district: "25", party: "D" },
  { name: "Julia Brownley", state: "CA", district: "26", party: "D" },
  { name: "Mike Garcia", state: "CA", district: "27", party: "R" },
  { name: "Judy Chu", state: "CA", district: "28", party: "D" },
  { name: "Tony Cárdenas", state: "CA", district: "29", party: "D" },
  { name: "Adam Schiff", state: "CA", district: "30", party: "D" },
  { name: "Grace Napolitano", state: "CA", district: "31", party: "D" },
  { name: "Brad Sherman", state: "CA", district: "32", party: "D" },
  { name: "Pete Aguilar", state: "CA", district: "33", party: "D" },
  { name: "Jimmy Gomez", state: "CA", district: "34", party: "D" },
  { name: "Norma Torres", state: "CA", district: "35", party: "D" },
  { name: "Ted Lieu", state: "CA", district: "36", party: "D" },
  { name: "Sydney Kamlager-Dove", state: "CA", district: "37", party: "D" },
  { name: "Linda Sánchez", state: "CA", district: "38", party: "D" },
  { name: "Mark Takano", state: "CA", district: "39", party: "D" },
  { name: "Young Kim", state: "CA", district: "40", party: "R" },
  { name: "Ken Calvert", state: "CA", district: "41", party: "R" },
  { name: "Robert Garcia", state: "CA", district: "42", party: "D" },
  { name: "Maxine Waters", state: "CA", district: "43", party: "D" },
  { name: "Nanette Barragán", state: "CA", district: "44", party: "D" },
  { name: "Michelle Steel", state: "CA", district: "45", party: "R" },
  { name: "Lou Correa", state: "CA", district: "46", party: "D" },
  { name: "Katie Porter", state: "CA", district: "47", party: "D" },
  { name: "Darrell Issa", state: "CA", district: "48", party: "R" },
  { name: "Mike Levin", state: "CA", district: "49", party: "D" },
  { name: "Scott Peters", state: "CA", district: "50", party: "D" },
  { name: "Sara Jacobs", state: "CA", district: "51", party: "D" },
  { name: "Juan Vargas", state: "CA", district: "52", party: "D" },
  
  // Colorado
  { name: "Diana DeGette", state: "CO", district: "01", party: "D" },
  { name: "Joe Neguse", state: "CO", district: "02", party: "D" },
  { name: "Lauren Boebert", state: "CO", district: "03", party: "R" },
  { name: "Ken Buck", state: "CO", district: "04", party: "R" },
  { name: "Doug Lamborn", state: "CO", district: "05", party: "R" },
  { name: "Jason Crow", state: "CO", district: "06", party: "D" },
  { name: "Brittany Pettersen", state: "CO", district: "07", party: "D" },
  { name: "Yadira Caraveo", state: "CO", district: "08", party: "D" },
  
  // Connecticut
  { name: "John B. Larson", state: "CT", district: "01", party: "D" },
  { name: "Joe Courtney", state: "CT", district: "02", party: "D" },
  { name: "Rosa DeLauro", state: "CT", district: "03", party: "D" },
  { name: "Jim Himes", state: "CT", district: "04", party: "D" },
  { name: "Jahana Hayes", state: "CT", district: "05", party: "D" },
  
  // Delaware
  { name: "Lisa Blunt Rochester", state: "DE", district: "At Large", party: "D" },
  
  // Florida (28 districts)
  { name: "Matt Gaetz", state: "FL", district: "01", party: "R" },
  { name: "Neal Dunn", state: "FL", district: "02", party: "R" },
  { name: "Kat Cammack", state: "FL", district: "03", party: "R" },
  { name: "Aaron Bean", state: "FL", district: "04", party: "R" },
  { name: "John Rutherford", state: "FL", district: "05", party: "R" },
  { name: "Michael Waltz", state: "FL", district: "06", party: "R" },
  { name: "Cory Mills", state: "FL", district: "07", party: "R" },
  { name: "Bill Posey", state: "FL", district: "08", party: "R" },
  { name: "Darren Soto", state: "FL", district: "09", party: "D" },
  { name: "Daniel Webster", state: "FL", district: "10", party: "R" },
  { name: "Gus Bilirakis", state: "FL", district: "11", party: "R" },
  { name: "Laurel Lee", state: "FL", district: "12", party: "R" },
  { name: "Anna Paulina Luna", state: "FL", district: "13", party: "R" },
  { name: "Kathy Castor", state: "FL", district: "14", party: "D" },
  { name: "Ross Spano", state: "FL", district: "15", party: "R" },
  { name: "Vern Buchanan", state: "FL", district: "16", party: "R" },
  { name: "Greg Steube", state: "FL", district: "17", party: "R" },
  { name: "Scott Franklin", state: "FL", district: "18", party: "R" },
  { name: "Byron Donalds", state: "FL", district: "19", party: "R" },
  { name: "Sheila Cherfilus-McCormick", state: "FL", district: "20", party: "D" },
  { name: "Lois Frankel", state: "FL", district: "21", party: "D" },
  { name: "Jared Moskowitz", state: "FL", district: "22", party: "D" },
  { name: "Debbie Wasserman Schultz", state: "FL", district: "23", party: "D" },
  { name: "Frederica Wilson", state: "FL", district: "24", party: "D" },
  { name: "Mario Díaz-Balart", state: "FL", district: "25", party: "R" },
  { name: "Carlos Giménez", state: "FL", district: "26", party: "R" },
  { name: "María Elvira Salazar", state: "FL", district: "27", party: "R" },
  { name: "Donna Shalala", state: "FL", district: "28", party: "D" },
  
  // Georgia (14 districts)
  { name: "Buddy Carter", state: "GA", district: "01", party: "R" },
  { name: "Sanford Bishop", state: "GA", district: "02", party: "D" },
  { name: "Drew Ferguson", state: "GA", district: "03", party: "R" },
  { name: "Hank Johnson", state: "GA", district: "04", party: "D" },
  { name: "Nikema Williams", state: "GA", district: "05", party: "D" },
  { name: "Rich McCormick", state: "GA", district: "06", party: "R" },
  { name: "Lucy McBath", state: "GA", district: "07", party: "D" },
  { name: "Austin Scott", state: "GA", district: "08", party: "R" },
  { name: "Andrew Clyde", state: "GA", district: "09", party: "R" },
  { name: "Mike Collins", state: "GA", district: "10", party: "R" },
  { name: "Barry Loudermilk", state: "GA", district: "11", party: "R" },
  { name: "Rick Allen", state: "GA", district: "12", party: "R" },
  { name: "David Scott", state: "GA", district: "13", party: "D" },
  { name: "Marjorie Taylor Greene", state: "GA", district: "14", party: "R" },
  
  // Hawaii
  { name: "Ed Case", state: "HI", district: "01", party: "D" },
  { name: "Jill Tokuda", state: "HI", district: "02", party: "D" },
  
  // Idaho
  { name: "Russ Fulcher", state: "ID", district: "01", party: "R" },
  { name: "Mike Simpson", state: "ID", district: "02", party: "R" },
  
  // Illinois (17 districts)
  { name: "Jonathan Jackson", state: "IL", district: "01", party: "D" },
  { name: "Robin Kelly", state: "IL", district: "02", party: "D" },
  { name: "Delia Ramirez", state: "IL", district: "03", party: "D" },
  { name: "Jesús \"Chuy\" García", state: "IL", district: "04", party: "D" },
  { name: "Mike Quigley", state: "IL", district: "05", party: "D" },
  { name: "Sean Casten", state: "IL", district: "06", party: "D" },
  { name: "Danny Davis", state: "IL", district: "07", party: "D" },
  { name: "Raja Krishnamoorthi", state: "IL", district: "08", party: "D" },
  { name: "Jan Schakowsky", state: "IL", district: "09", party: "D" },
  { name: "Brad Schneider", state: "IL", district: "10", party: "D" },
  { name: "Bill Foster", state: "IL", district: "11", party: "D" },
  { name: "Mike Bost", state: "IL", district: "12", party: "R" },
  { name: "Nikki Budzinski", state: "IL", district: "13", party: "D" },
  { name: "Lauren Underwood", state: "IL", district: "14", party: "D" },
  { name: "Mary Miller", state: "IL", district: "15", party: "R" },
  { name: "Darin LaHood", state: "IL", district: "16", party: "R" },
  { name: "Eric Sorensen", state: "IL", district: "17", party: "D" },
  
  // Indiana (9 districts)
  { name: "Frank J. Mrvan", state: "IN", district: "01", party: "D" },
  { name: "Rudy Yakym", state: "IN", district: "02", party: "R" },
  { name: "Marlin Stutzman", state: "IN", district: "03", party: "R" },
  { name: "Jim Baird", state: "IN", district: "04", party: "R" },
  { name: "Victoria Spartz", state: "IN", district: "05", party: "R" },
  { name: "Greg Pence", state: "IN", district: "06", party: "R" },
  { name: "André Carson", state: "IN", district: "07", party: "D" },
  { name: "Larry Bucshon", state: "IN", district: "08", party: "R" },
  { name: "Erin Houchin", state: "IN", district: "09", party: "R" },
  
  // Iowa
  { name: "Mariannette Miller-Meeks", state: "IA", district: "01", party: "R" },
  { name: "Ashley Hinson", state: "IA", district: "02", party: "R" },
  { name: "Zach Nunn", state: "IA", district: "03", party: "R" },
  { name: "Randy Feenstra", state: "IA", district: "04", party: "R" },
  
  // Kansas
  { name: "Tracey Mann", state: "KS", district: "01", party: "R" },
  { name: "Jake LaTurner", state: "KS", district: "02", party: "R" },
  { name: "Sharice Davids", state: "KS", district: "03", party: "D" },
  { name: "Ron Estes", state: "KS", district: "04", party: "R" },
  
  // Kentucky (6 districts)
  { name: "James Comer", state: "KY", district: "01", party: "R" },
  { name: "Brett Guthrie", state: "KY", district: "02", party: "R" },
  { name: "Morgan McGarvey", state: "KY", district: "03", party: "D" },
  { name: "Thomas Massie", state: "KY", district: "04", party: "R" },
  { name: "Hal Rogers", state: "KY", district: "05", party: "R" },
  { name: "Andy Barr", state: "KY", district: "06", party: "R" },
  
  // Louisiana (6 districts)
  { name: "Steve Scalise", state: "LA", district: "01", party: "R" },
  { name: "Troy Carter", state: "LA", district: "02", party: "D" },
  { name: "Clay Higgins", state: "LA", district: "03", party: "R" },
  { name: "Mike Johnson", state: "LA", district: "04", party: "R" },
  { name: "Julia Letlow", state: "LA", district: "05", party: "R" },
  { name: "Garret Graves", state: "LA", district: "06", party: "R" },
  
  // Maine
  { name: "Chellie Pingree", state: "ME", district: "01", party: "D" },
  { name: "Jared Golden", state: "ME", district: "02", party: "D" },
  
  // Maryland (8 districts)
  { name: "Andy Harris", state: "MD", district: "01", party: "R" },
  { name: "Dutch Ruppersberger", state: "MD", district: "02", party: "D" },
  { name: "John Sarbanes", state: "MD", district: "03", party: "D" },
  { name: "Glenn Ivey", state: "MD", district: "04", party: "D" },
  { name: "Steny Hoyer", state: "MD", district: "05", party: "D" },
  { name: "David Trone", state: "MD", district: "06", party: "D" },
  { name: "Kweisi Mfume", state: "MD", district: "07", party: "D" },
  { name: "Jamie Raskin", state: "MD", district: "08", party: "D" },
  
  // Massachusetts (9 districts)
  { name: "Richard Neal", state: "MA", district: "01", party: "D" },
  { name: "Jim McGovern", state: "MA", district: "02", party: "D" },
  { name: "Lori Trahan", state: "MA", district: "03", party: "D" },
  { name: "Jake Auchincloss", state: "MA", district: "04", party: "D" },
  { name: "Katherine Clark", state: "MA", district: "05", party: "D" },
  { name: "Seth Moulton", state: "MA", district: "06", party: "D" },
  { name: "Ayanna Pressley", state: "MA", district: "07", party: "D" },
  { name: "Stephen Lynch", state: "MA", district: "08", party: "D" },
  { name: "Bill Keating", state: "MA", district: "09", party: "D" },
  
  // Michigan (13 districts)
  { name: "Jack Bergman", state: "MI", district: "01", party: "R" },
  { name: "John Moolenaar", state: "MI", district: "02", party: "R" },
  { name: "Hillary Scholten", state: "MI", district: "03", party: "D" },
  { name: "Bill Huizenga", state: "MI", district: "04", party: "R" },
  { name: "Tim Walberg", state: "MI", district: "05", party: "R" },
  { name: "Debbie Dingell", state: "MI", district: "06", party: "D" },
  { name: "Elissa Slotkin", state: "MI", district: "07", party: "D" },
  { name: "Dan Kildee", state: "MI", district: "08", party: "D" },
  { name: "Lisa McClain", state: "MI", district: "09", party: "R" },
  { name: "John James", state: "MI", district: "10", party: "R" },
  { name: "Haley Stevens", state: "MI", district: "11", party: "D" },
  { name: "Rashida Tlaib", state: "MI", district: "12", party: "D" },
  { name: "Shri Thanedar", state: "MI", district: "13", party: "D" },
  
  // Minnesota (8 districts)
  { name: "Brad Finstad", state: "MN", district: "01", party: "R" },
  { name: "Angie Craig", state: "MN", district: "02", party: "D" },
  { name: "Tom Emmer", state: "MN", district: "03", party: "R" },
  { name: "Betty McCollum", state: "MN", district: "04", party: "D" },
  { name: "Ilhan Omar", state: "MN", district: "05", party: "D" },
  { name: "Michelle Fischbach", state: "MN", district: "06", party: "R" },
  { name: "Collin Peterson", state: "MN", district: "07", party: "D" },
  { name: "Pete Stauber", state: "MN", district: "08", party: "R" },
  
  // Mississippi (4 districts)
  { name: "Trent Kelly", state: "MS", district: "01", party: "R" },
  { name: "Bennie Thompson", state: "MS", district: "02", party: "D" },
  { name: "Michael Guest", state: "MS", district: "03", party: "R" },
  { name: "Mike Ezell", state: "MS", district: "04", party: "R" },
  
  // Missouri (8 districts)
  { name: "Cori Bush", state: "MO", district: "01", party: "D" },
  { name: "Ann Wagner", state: "MO", district: "02", party: "R" },
  { name: "Blaine Luetkemeyer", state: "MO", district: "03", party: "R" },
  { name: "Mark Alford", state: "MO", district: "04", party: "R" },
  { name: "Emanuel Cleaver", state: "MO", district: "05", party: "D" },
  { name: "Sam Graves", state: "MO", district: "06", party: "R" },
  { name: "Eric Burlison", state: "MO", district: "07", party: "R" },
  { name: "Jason Smith", state: "MO", district: "08", party: "R" },
  
  // Montana
  { name: "Ryan Zinke", state: "MT", district: "01", party: "R" },
  { name: "Matt Rosendale", state: "MT", district: "02", party: "R" },
  
  // Nebraska
  { name: "Mike Flood", state: "NE", district: "01", party: "R" },
  { name: "Don Bacon", state: "NE", district: "02", party: "R" },
  { name: "Adrian Smith", state: "NE", district: "03", party: "R" },
  
  // Nevada (4 districts)
  { name: "Dina Titus", state: "NV", district: "01", party: "D" },
  { name: "Mark Amodei", state: "NV", district: "02", party: "R" },
  { name: "Susie Lee", state: "NV", district: "03", party: "D" },
  { name: "Steven Horsford", state: "NV", district: "04", party: "D" },
  
  // New Hampshire
  { name: "Chris Pappas", state: "NH", district: "01", party: "D" },
  { name: "Annie Kuster", state: "NH", district: "02", party: "D" },
  
  // New Jersey (12 districts)
  { name: "Donald Norcross", state: "NJ", district: "01", party: "D" },
  { name: "Jeff Van Drew", state: "NJ", district: "02", party: "R" },
  { name: "Andy Kim", state: "NJ", district: "03", party: "D" },
  { name: "Chris Smith", state: "NJ", district: "04", party: "R" },
  { name: "Josh Gottheimer", state: "NJ", district: "05", party: "D" },
  { name: "Frank Pallone", state: "NJ", district: "06", party: "D" },
  { name: "Tom Kean Jr.", state: "NJ", district: "07", party: "R" },
  { name: "Rob Menendez", state: "NJ", district: "08", party: "D" },
  { name: "Bill Pascrell", state: "NJ", district: "09", party: "D" },
  { name: "Donald Payne Jr.", state: "NJ", district: "10", party: "D" },
  { name: "Mikie Sherrill", state: "NJ", district: "11", party: "D" },
  { name: "Bonnie Watson Coleman", state: "NJ", district: "12", party: "D" },
  
  // New Mexico
  { name: "Melanie Stansbury", state: "NM", district: "01", party: "D" },
  { name: "Gabe Vasquez", state: "NM", district: "02", party: "D" },
  { name: "Teresa Leger Fernández", state: "NM", district: "03", party: "D" },
  
  // New York (26 districts)
  { name: "Nick LaLota", state: "NY", district: "01", party: "R" },
  { name: "Andrew Garbarino", state: "NY", district: "02", party: "R" },
  { name: "George Santos", state: "NY", district: "03", party: "R" },
  { name: "Anthony D'Esposito", state: "NY", district: "04", party: "R" },
  { name: "Gregory Meeks", state: "NY", district: "05", party: "D" },
  { name: "Grace Meng", state: "NY", district: "06", party: "D" },
  { name: "Nydia Velázquez", state: "NY", district: "07", party: "D" },
  { name: "Hakeem Jeffries", state: "NY", district: "08", party: "D" },
  { name: "Yvette Clarke", state: "NY", district: "09", party: "D" },
  { name: "Dan Goldman", state: "NY", district: "10", party: "D" },
  { name: "Nicole Malliotakis", state: "NY", district: "11", party: "R" },
  { name: "Jerry Nadler", state: "NY", district: "12", party: "D" },
  { name: "Adriano Espaillat", state: "NY", district: "13", party: "D" },
  { name: "Alexandria Ocasio-Cortez", state: "NY", district: "14", party: "D" },
  { name: "Ritchie Torres", state: "NY", district: "15", party: "D" },
  { name: "Jamaal Bowman", state: "NY", district: "16", party: "D" },
  { name: "Mike Lawler", state: "NY", district: "17", party: "R" },
  { name: "Pat Ryan", state: "NY", district: "18", party: "D" },
  { name: "Marc Molinaro", state: "NY", district: "19", party: "R" },
  { name: "Paul Tonko", state: "NY", district: "20", party: "D" },
  { name: "Elise Stefanik", state: "NY", district: "21", party: "R" },
  { name: "Brandon Williams", state: "NY", district: "22", party: "R" },
  { name: "Nick Langworthy", state: "NY", district: "23", party: "R" },
  { name: "Claudia Tenney", state: "NY", district: "24", party: "R" },
  { name: "Joseph Morelle", state: "NY", district: "25", party: "D" },
  { name: "Brian Higgins", state: "NY", district: "26", party: "D" },
  
  // North Carolina (14 districts)
  { name: "Don Davis", state: "NC", district: "01", party: "D" },
  { name: "Deborah Ross", state: "NC", district: "02", party: "D" },
  { name: "Greg Murphy", state: "NC", district: "03", party: "R" },
  { name: "Valerie Foushee", state: "NC", district: "04", party: "D" },
  { name: "Virginia Foxx", state: "NC", district: "05", party: "R" },
  { name: "Kathy Manning", state: "NC", district: "06", party: "D" },
  { name: "David Rouzer", state: "NC", district: "07", party: "R" },
  { name: "Dan Bishop", state: "NC", district: "08", party: "R" },
  { name: "Richard Hudson", state: "NC", district: "09", party: "R" },
  { name: "Patrick McHenry", state: "NC", district: "10", party: "R" },
  { name: "Chuck Edwards", state: "NC", district: "11", party: "R" },
  { name: "Alma Adams", state: "NC", district: "12", party: "D" },
  { name: "Wiley Nickel", state: "NC", district: "13", party: "D" },
  { name: "Jeff Jackson", state: "NC", district: "14", party: "D" },
  
  // North Dakota
  { name: "Kelly Armstrong", state: "ND", district: "At Large", party: "R" },
  
  // Ohio (15 districts)
  { name: "Greg Landsman", state: "OH", district: "01", party: "D" },
  { name: "Brad Wenstrup", state: "OH", district: "02", party: "R" },
  { name: "Joyce Beatty", state: "OH", district: "03", party: "D" },
  { name: "Jim Jordan", state: "OH", district: "04", party: "R" },
  { name: "Bob Latta", state: "OH", district: "05", party: "R" },
  { name: "Bill Johnson", state: "OH", district: "06", party: "R" },
  { name: "Max Miller", state: "OH", district: "07", party: "R" },
  { name: "Warren Davidson", state: "OH", district: "08", party: "R" },
  { name: "Marcy Kaptur", state: "OH", district: "09", party: "D" },
  { name: "Mike Turner", state: "OH", district: "10", party: "R" },
  { name: "Shontel Brown", state: "OH", district: "11", party: "D" },
  { name: "Troy Balderson", state: "OH", district: "12", party: "R" },
  { name: "Emilia Sykes", state: "OH", district: "13", party: "D" },
  { name: "David Joyce", state: "OH", district: "14", party: "R" },
  { name: "Mike Carey", state: "OH", district: "15", party: "R" },
  
  // Oklahoma (5 districts)
  { name: "Kevin Hern", state: "OK", district: "01", party: "R" },
  { name: "Josh Brecheen", state: "OK", district: "02", party: "R" },
  { name: "Frank Lucas", state: "OK", district: "03", party: "R" },
  { name: "Tom Cole", state: "OK", district: "04", party: "R" },
  { name: "Stephanie Bice", state: "OK", district: "05", party: "R" },
  
  // Oregon (6 districts)
  { name: "Suzanne Bonamici", state: "OR", district: "01", party: "D" },
  { name: "Cliff Bentz", state: "OR", district: "02", party: "R" },
  { name: "Earl Blumenauer", state: "OR", district: "03", party: "D" },
  { name: "Val Hoyle", state: "OR", district: "04", party: "D" },
  { name: "Lori Chavez-DeRemer", state: "OR", district: "05", party: "R" },
  { name: "Andrea Salinas", state: "OR", district: "06", party: "D" },
  
  // Pennsylvania (17 districts)
  { name: "Brian Fitzpatrick", state: "PA", district: "01", party: "R" },
  { name: "Brendan Boyle", state: "PA", district: "02", party: "D" },
  { name: "Dwight Evans", state: "PA", district: "03", party: "D" },
  { name: "Madeleine Dean", state: "PA", district: "04", party: "D" },
  { name: "Mary Gay Scanlon", state: "PA", district: "05", party: "D" },
  { name: "Chrissy Houlahan", state: "PA", district: "06", party: "D" },
  { name: "Susan Wild", state: "PA", district: "07", party: "D" },
  { name: "Matt Cartwright", state: "PA", district: "08", party: "D" },
  { name: "Dan Meuser", state: "PA", district: "09", party: "R" },
  { name: "Scott Perry", state: "PA", district: "10", party: "R" },
  { name: "Lloyd Smucker", state: "PA", district: "11", party: "R" },
  { name: "Summer Lee", state: "PA", district: "12", party: "D" },
  { name: "John Joyce", state: "PA", district: "13", party: "R" },
  { name: "Guy Reschenthaler", state: "PA", district: "14", party: "R" },
  { name: "Glenn Thompson", state: "PA", district: "15", party: "R" },
  { name: "Mike Kelly", state: "PA", district: "16", party: "R" },
  { name: "Chris Deluzio", state: "PA", district: "17", party: "D" },
  
  // Rhode Island
  { name: "Gabe Amo", state: "RI", district: "01", party: "D" },
  { name: "Seth Magaziner", state: "RI", district: "02", party: "D" },
  
  // South Carolina (7 districts)
  { name: "Nancy Mace", state: "SC", district: "01", party: "R" },
  { name: "Joe Wilson", state: "SC", district: "02", party: "R" },
  { name: "Jeff Duncan", state: "SC", district: "03", party: "R" },
  { name: "William Timmons", state: "SC", district: "04", party: "R" },
  { name: "Ralph Norman", state: "SC", district: "05", party: "R" },
  { name: "Jim Clyburn", state: "SC", district: "06", party: "D" },
  { name: "Russell Fry", state: "SC", district: "07", party: "R" },
  
  // South Dakota
  { name: "Dusty Johnson", state: "SD", district: "At Large", party: "R" },
  
  // Tennessee (9 districts)
  { name: "Diana Harshbarger", state: "TN", district: "01", party: "R" },
  { name: "Tim Burchett", state: "TN", district: "02", party: "R" },
  { name: "Chuck Fleischmann", state: "TN", district: "03", party: "R" },
  { name: "Scott DesJarlais", state: "TN", district: "04", party: "R" },
  { name: "Andy Ogles", state: "TN", district: "05", party: "R" },
  { name: "John Rose", state: "TN", district: "06", party: "R" },
  { name: "Mark Green", state: "TN", district: "07", party: "R" },
  { name: "David Kustoff", state: "TN", district: "08", party: "R" },
  { name: "Steve Cohen", state: "TN", district: "09", party: "D" },
  
  // Texas (38 districts)
  { name: "Nathaniel Moran", state: "TX", district: "01", party: "R" },
  { name: "Dan Crenshaw", state: "TX", district: "02", party: "R" },
  { name: "Keith Self", state: "TX", district: "03", party: "R" },
  { name: "Pat Fallon", state: "TX", district: "04", party: "R" },
  { name: "Lance Gooden", state: "TX", district: "05", party: "R" },
  { name: "Jake Ellzey", state: "TX", district: "06", party: "R" },
  { name: "Lizzie Fletcher", state: "TX", district: "07", party: "D" },
  { name: "Morgan Luttrell", state: "TX", district: "08", party: "R" },
  { name: "Al Green", state: "TX", district: "09", party: "D" },
  { name: "Michael McCaul", state: "TX", district: "10", party: "R" },
  { name: "August Pfluger", state: "TX", district: "11", party: "R" },
  { name: "Kay Granger", state: "TX", district: "12", party: "R" },
  { name: "Ronny Jackson", state: "TX", district: "13", party: "R" },
  { name: "Randy Weber", state: "TX", district: "14", party: "R" },
  { name: "Monica De La Cruz", state: "TX", district: "15", party: "R" },
  { name: "Veronica Escobar", state: "TX", district: "16", party: "D" },
  { name: "Pete Sessions", state: "TX", district: "17", party: "R" },
  { name: "Sheila Jackson Lee", state: "TX", district: "18", party: "D" },
  { name: "Jodey Arrington", state: "TX", district: "19", party: "R" },
  { name: "Joaquin Castro", state: "TX", district: "20", party: "D" },
  { name: "Chip Roy", state: "TX", district: "21", party: "R" },
  { name: "Troy Nehls", state: "TX", district: "22", party: "R" },
  { name: "Tony Gonzales", state: "TX", district: "23", party: "R" },
  { name: "Beth Van Duyne", state: "TX", district: "24", party: "R" },
  { name: "Roger Williams", state: "TX", district: "25", party: "R" },
  { name: "Michael Burgess", state: "TX", district: "26", party: "R" },
  { name: "Michael Cloud", state: "TX", district: "27", party: "R" },
  { name: "Henry Cuellar", state: "TX", district: "28", party: "D" },
  { name: "Sylvia Garcia", state: "TX", district: "29", party: "D" },
  { name: "Jasmine Crockett", state: "TX", district: "30", party: "D" },
  { name: "John Carter", state: "TX", district: "31", party: "R" },
  { name: "Colin Allred", state: "TX", district: "32", party: "D" },
  { name: "Marc Veasey", state: "TX", district: "33", party: "D" },
  { name: "Vicente Gonzalez", state: "TX", district: "34", party: "D" },
  { name: "Greg Casar", state: "TX", district: "35", party: "D" },
  { name: "Brian Babin", state: "TX", district: "36", party: "R" },
  
  // Utah (4 districts)
  { name: "Blake Moore", state: "UT", district: "01", party: "R" },
  { name: "Celeste Maloy", state: "UT", district: "02", party: "R" },
  { name: "John Curtis", state: "UT", district: "03", party: "R" },
  { name: "Burgess Owens", state: "UT", district: "04", party: "R" },
  
  // Vermont
  { name: "Becca Balint", state: "VT", district: "At Large", party: "D" },
  
  // Virginia (11 districts)
  { name: "Rob Wittman", state: "VA", district: "01", party: "R" },
  { name: "Jen Kiggans", state: "VA", district: "02", party: "R" },
  { name: "Bobby Scott", state: "VA", district: "03", party: "D" },
  { name: "Jennifer McClellan", state: "VA", district: "04", party: "D" },
  { name: "Bob Good", state: "VA", district: "05", party: "R" },
  { name: "Ben Cline", state: "VA", district: "06", party: "R" },
  { name: "Abigail Spanberger", state: "VA", district: "07", party: "D" },
  { name: "Don Beyer", state: "VA", district: "08", party: "D" },
  { name: "Morgan Griffith", state: "VA", district: "09", party: "R" },
  { name: "Jennifer Wexton", state: "VA", district: "10", party: "D" },
  { name: "Gerry Connolly", state: "VA", district: "11", party: "D" },
  
  // Washington (10 districts)
  { name: "Suzan DelBene", state: "WA", district: "01", party: "D" },
  { name: "Rick Larsen", state: "WA", district: "02", party: "D" },
  { name: "Marie Gluesenkamp Perez", state: "WA", district: "03", party: "D" },
  { name: "Dan Newhouse", state: "WA", district: "04", party: "R" },
  { name: "Cathy McMorris Rodgers", state: "WA", district: "05", party: "R" },
  { name: "Derek Kilmer", state: "WA", district: "06", party: "D" },
  { name: "Pramila Jayapal", state: "WA", district: "07", party: "D" },
  { name: "Kim Schrier", state: "WA", district: "08", party: "D" },
  { name: "Adam Smith", state: "WA", district: "09", party: "D" },
  { name: "Marilyn Strickland", state: "WA", district: "10", party: "D" },
  
  // West Virginia
  { name: "Carol Miller", state: "WV", district: "01", party: "R" },
  { name: "Alex Mooney", state: "WV", district: "02", party: "R" },
  
  // Wisconsin (8 districts)
  { name: "Bryan Steil", state: "WI", district: "01", party: "R" },
  { name: "Mark Pocan", state: "WI", district: "02", party: "D" },
  { name: "Derrick Van Orden", state: "WI", district: "03", party: "R" },
  { name: "Gwen Moore", state: "WI", district: "04", party: "D" },
  { name: "Scott Fitzgerald", state: "WI", district: "05", party: "R" },
  { name: "Glenn Grothman", state: "WI", district: "06", party: "R" },
  { name: "Tom Tiffany", state: "WI", district: "07", party: "R" },
  { name: "Mike Gallagher", state: "WI", district: "08", party: "R" },
  
  // Wyoming
  { name: "Harriet Hageman", state: "WY", district: "At Large", party: "R" },
];

/**
 * Get party for a House member by matching name+state+district
 */
export function getPartyForHouseMember(
  name: string,
  state: string,
  district: string | null
): "D" | "R" | "I" | null {
  const districtStr = district || "At Large";
  
  // Normalize name for matching
  const normalize = (n: string) => n.toLowerCase().replace(/\s+/g, " ").replace(/[.,]/g, "").trim();
  const normalizedName = normalize(name);
  
  // Find matching entry
  for (const entry of HOUSE_PARTY_LIST) {
    if (entry.state === state && entry.district === districtStr) {
      const entryName = normalize(entry.name);
      
      // Exact match
      if (entryName === normalizedName) {
        return entry.party;
      }
      
      // Check if last names match
      const nameParts = normalizedName.split(" ");
      const entryParts = entryName.split(" ");
      
      if (nameParts.length >= 2 && entryParts.length >= 2) {
        const lastName1 = nameParts[nameParts.length - 1];
        const lastName2 = entryParts[entryParts.length - 1];
        
        if (lastName1 === lastName2) {
          // Last names match, likely the same person
          return entry.party;
        }
      }
    }
  }
  
  return null;
}

